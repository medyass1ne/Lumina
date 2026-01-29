const mongoose = require('mongoose');
const cron = require('node-cron');
const sharp = require('sharp');
const { Readable } = require('stream');
const { Agent, fetch: undiciFetch } = require('undici');


require('dotenv').config({ path: '.env.local' });

// --- MongoDB Schemas ---
const UserSchema = new mongoose.Schema({
    email: String,
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    watchSettings: {
        isEnabled: Boolean,
        folderId: String,
        processedIds: [String],
        templateId: String,
        scale: Number
    },
    templates: Array,
});
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// --- Helpers ---
async function refreshAccessToken(refreshToken) {
    if (!refreshToken) return null;
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.GOOGLE_CLIENT_ID);
        params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
        params.append('refresh_token', refreshToken);
        params.append('grant_type', 'refresh_token');

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            body: params
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error_description || data.error);

        return {
            access_token: data.access_token,
            expires_in: data.expires_in,
            refresh_token: data.refresh_token
        };
    } catch (e) {
        console.error("Token refresh failed:", e.message);
        return null;
    }
}

async function listFiles(accessToken, folderId) {
    const q = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink)&orderBy=createdTime desc&pageSize=50`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.files || [];
    } catch (e) {
        return [];
    }
}

async function downloadFile(accessToken, fileId) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(`Failed to download file ${fileId}`);
    return await res.arrayBuffer();
}

async function uploadFile(accessToken, buffer, name, folderId, mimeType = 'image/png') {
    const metadata = {
        name: name,
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([buffer], { type: mimeType }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload failed: ${err}`);
    }
    return await res.json();
}

async function processImage(fileBuffer, templateBuffer, scale = 2) {

    const imageMeta = await sharp(fileBuffer).metadata();
    const width = imageMeta.width;
    const height = imageMeta.height;

    const resizedTemplate = await sharp(templateBuffer)
        .resize(width, height, { fit: 'fill' })
        .toBuffer();

    // 3. Composite (Template over Image)
    const outputBuffer = await sharp(fileBuffer)
        .composite([{ input: resizedTemplate, blend: 'over' }])
        .png({ quality: 90 })
        .toBuffer();

    return outputBuffer;
}

async function deleteFile(accessToken, fileId) {
    try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) console.error(`Failed to delete file ${fileId}: ${res.status}`);
        else console.log(`Deleted temporary file: ${fileId}`);
    } catch (e) {
        console.error("Delete error:", e.message);
    }
}

// --- Main Logic ---
const processingUsers = new Set();

async function processAndTrigger(files, accessToken, project) {
    const templateId = project.watchSettings.templateId;
    let templateBuffer = null;

    if (templateId) {
        console.log(`[Debug] Looking for template ID: "${templateId}" in ${project.templates?.length || 0} templates.`);

        const template = project.templates.find(t => t.id === templateId);

        if (template) {
            if (template.driveFileId) {
                console.log(`[Debug] Found template "${template.name}". Downloading from Drive ID: ${template.driveFileId}...`);
                try {
                    templateBuffer = await downloadFile(accessToken, template.driveFileId);
                    console.log(`[Debug] Template downloaded successfully (${templateBuffer.byteLength} bytes).`);
                } catch (e) {
                    console.error(`[Error] Failed to download template file (${template.driveFileId}):`, e.message);
                }
            } else {
                console.error(`[Error] Template "${template.name}" has no driveFileId.`);
            }
        } else {
            console.error(`[Error] Configured template ID "${templateId}" not found in project templates.`);
            if (project.templates) {
                console.log(`[Debug] Available Template IDs:`, project.templates.map(t => t.id));
            }
        }
    } else {
        console.warn(`[Warning] No templateId configured for watcher.`);
    }

    const processedFileIds = [];

    for (const file of files) {
        try {
            console.log(`Processing file: ${file.name} (${file.id})...`);

            if (!templateBuffer) {
                console.error(`[Skip] Cannot process ${file.name}: No active template loaded. Waiting for configuration fix.`);
                continue;
            }

            const inputBuffer = await downloadFile(accessToken, file.id);

            const outputBuffer = await processImage(inputBuffer, templateBuffer, project.watchSettings.scale);

            const newName = file.name.replace(/\.[^/.]+$/, '') + '_processed.png';
            const uploadResult = await uploadFile(accessToken, outputBuffer, newName, project.watchSettings.folderId);

            console.log(`Saved processed file: ${uploadResult.id}`);
            processedFileIds.push(uploadResult.id);

        } catch (e) {
            console.error(`Error processing file ${file.id}:`, e);
        }
    }



    if (processedFileIds.length === 0) return false;

    try {
        const body = {
            files: processedFileIds,
            accessToken: accessToken,
            projectId: project._id,
            timestamp: new Date().toISOString()
        };

        const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:5678/webhook/enhance-images";
        console.log("Triggering Webhook with payload:", JSON.stringify(body));

        const webhookDispatcher = new Agent({
            headersTimeout: 30 * 60 * 1000,
            connectTimeout: 30 * 60 * 1000,
            bodyTimeout: 30 * 60 * 1000,
        });

        const res = await undiciFetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            dispatcher: webhookDispatcher
        });

        console.log("Webhook Status:", res.status);

        if (res.ok) {
            console.log("Webhook success. Cleaning up processed files...");
            for (const id of processedFileIds) {
                await deleteFile(accessToken, id);
            }
            return true;
        }
        return false;
    } catch (e) {
        console.error("Webhook trigger failed:", e);
        return false;
    }
}

// --- Worker Loop ---
async function run() {
    console.log("Starting Watcher Service (with Sharp Processing)...");
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina';

    mongoose.set('strictQuery', false);

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    cron.schedule('* * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Checking active watchers...`);

        try {
            const projects = await Project.find({ 'watchSettings.isEnabled': true }).populate('userId');

            for (const p of projects) {
                const userIdStr = p.userId?._id?.toString();
                if (!userIdStr || processingUsers.has(userIdStr)) {
                    if (userIdStr && processingUsers.has(userIdStr)) console.log(`[Skip] User ${userIdStr} busy.`);
                    continue;
                }

                if (!p.userId || !p.userId.refreshToken) continue;

                processingUsers.add(userIdStr);
                try {


                    let accessToken = p.userId.accessToken;
                    let tokenExpiry = p.userId.tokenExpiry ? new Date(p.userId.tokenExpiry) : null;
                    const now = new Date();

                    // Refresh if missing, expired, or aging (>30 mins old = <30 mins remaining)
                    const needsRefresh = !accessToken || !tokenExpiry || (tokenExpiry.getTime() - now.getTime() < 30 * 60 * 1000);

                    if (needsRefresh) {
                        console.log(`[Token] Refreshing token for user ${p.userId._id}...`);
                        const tokenData = await refreshAccessToken(p.userId.refreshToken);

                        if (tokenData && tokenData.access_token) {
                            accessToken = tokenData.access_token;
                            const expiresInSeconds = tokenData.expires_in || 3599;
                            tokenExpiry = new Date(now.getTime() + (expiresInSeconds * 1000) - 60000);

                            await User.updateOne(
                                { _id: p.userId._id },
                                {
                                    accessToken: accessToken,
                                    tokenExpiry: tokenExpiry,
                                    ...(tokenData.refresh_token && { refreshToken: tokenData.refresh_token })
                                }
                            );
                            console.log(`[Token] Updated DB. Next refresh at ${tokenExpiry.toISOString()}`);
                        } else {
                            console.error(`[Token] Refresh failed. Skipping project.`);
                            continue;
                        }
                    }

                    if (!accessToken) continue;

                    // --- STORAGE QUOTA CHECK ---
                    const quota = await getDriveQuota(accessToken);
                    if (quota && quota.limit) {
                        const freeBytes = parseInt(quota.limit) - parseInt(quota.usage);
                        if (freeBytes < 50 * 1024 * 1024) {
                            console.warn(`[Skip] User ${p.userId._id} has insufficient storage (${(freeBytes / 1024 / 1024).toFixed(1)}MB free).`);
                            continue;
                        }
                    }
                    // ---------------------------

                    const folderId = p.watchSettings.folderId;
                    if (!folderId) continue;

                    const potentialFiles = await listFiles(accessToken, folderId);

                    const newFiles = potentialFiles.filter(f =>
                        !p.watchSettings.processedIds.includes(f.id) &&
                        !(f.name || "").includes("_processed")
                    );

                    if (newFiles.length > 0) {
                        console.log(`Project "${p.name}": Found ${newFiles.length} new files.`);

                        const success = await processAndTrigger(newFiles, accessToken, p);

                        if (success) {
                            // (We also don't want to process the _processed files, handled by filter)
                            const idsToMark = newFiles.map(f => f.id);

                            await Project.updateOne(
                                { _id: p._id },
                                { $push: { 'watchSettings.processedIds': { $each: idsToMark } } }
                            );
                            console.log(`Updated processed list for "${p.name}".`);
                        }
                    }
                } catch (e) {
                    console.error(`Error processing project "${p.name}":`, e);
                } finally {
                    processingUsers.delete(userIdStr);
                }
            }
        } catch (error) {
            console.error("Watcher loop error:", error);
        }
    });
}

run();

async function getDriveQuota(accessToken) {
    try {
        const { fetch: undiciFetch } = require('undici');
        const res = await undiciFetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            return data.storageQuota;
        }
        return null;
    } catch (e) {
        console.error("Quota check failed:", e);
        return null;
    }
}
