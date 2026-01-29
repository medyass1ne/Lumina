export async function refreshDriveLinks(accessToken, files) {
    if (!accessToken || !files || files.length === 0) return [];

    // Filter relevant files (Drive source only)
    const driveFiles = files.filter(f => f.source === 'drive' && f.id);
    if (driveFiles.length === 0) return [];

    console.log(`Refreshing links for ${driveFiles.length} Drive files...`);

    const updates = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < driveFiles.length; i += BATCH_SIZE) {
        const batch = driveFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (f) => {
            try {
                // Request fields for thumbnails, content, and dimensions (to fix 'Unknown' files)
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?fields=thumbnailLink,webContentLink,mimeType,imageMediaMetadata`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // NOTE: data.thumbnailLink often has =s220. 
                    // We use the default (=s220) for the grid 'thumbnail' to save bandwidth/rate-limits
                    // We generate a high-res version (=s1000) only for the 'previewUrl' (modal/editor)

                    const defaultThumbnail = data.thumbnailLink;
                    const highResThumbnail = data.thumbnailLink ? data.thumbnailLink.replace(/=s\d+/, '=s1000') : null;

                    const changes = {
                        thumbnail: defaultThumbnail,
                        previewUrl: highResThumbnail || defaultThumbnail
                    };

                    if (data.imageMediaMetadata) {
                        const { width, height } = data.imageMediaMetadata;
                        if (width && height) {
                            const ratio = width / height;
                            changes.width = width;
                            changes.height = height;
                            changes.aspectRatio = ratio;

                            if (ratio > 1.2) changes.orientation = "Landscape";
                            else if (ratio < 0.8) changes.orientation = "Portrait";
                            else changes.orientation = "Square";
                        }
                    }

                    updates.push({
                        id: f.id,
                        changes
                    });
                } else {
                    console.warn(`Drive refresh failed for ${f.id}: ${res.status}`);
                }
            } catch (e) {
                console.warn(`Failed to refresh link for file ${f.id}`, e);
            }
        }));
    }

    return updates;
}

export async function listFiles(accessToken, folderId, query = "") {
    if (!accessToken || !folderId) return [];

    try {
        let q = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
        if (query) {
            q += ` and ${query}`;
        }

        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,webContentLink,imageMediaMetadata)&orderBy=createdTime desc&pageSize=20`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            return data.files || [];
        } else {
            console.error("Failed to list files:", res.status);
            return [];
        }
    } catch (e) {
        console.error("List files error:", e);
        return [];
    }
}

export async function listFolders(accessToken, parentId = 'root') {
    if (!accessToken) return [];

    try {
        const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&orderBy=name`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            return data.files || [];
        }
        return [];
    } catch (e) {
        console.error("List folders error:", e);
        return [];
    }
}

export async function createFolder(accessToken, parentId, folderName) {
    if (!accessToken || !folderName) return null;

    try {
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : []
        };

        const res = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        if (res.ok) {
            return await res.json();
        } else {
            const err = await res.json();
            console.error("Create folder failed:", err);
            throw new Error(err.error?.message || "Failed to create folder");
        }
    } catch (e) {
        console.error("Create folder error:", e);
        throw e;
    }
}

export async function getDriveQuota(accessToken) {
    if (!accessToken) return null;
    try {
        const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
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
