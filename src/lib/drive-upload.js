import { AlertModal } from '@/components/ui/ConfirmModal';

export async function uploadToDrive(accessToken, blob, filename) {
    if (!accessToken) {
        throw new Error('No access token provided. Please sign in again.');
    }

    const existingFileId = await findExistingFile(accessToken, filename);

    const metadata = {
        name: filename,
        mimeType: 'image/png',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob, filename);

    const baseUrl = 'https://www.googleapis.com/upload/drive/v3/files';
    const url = existingFileId
        ? `${baseUrl}/${existingFileId}?uploadType=multipart`
        : `${baseUrl}?uploadType=multipart`;

    const method = existingFileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: form,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Drive Upload Error Body:", errorBody);

        let errorMessage = `Drive Upload Failed: ${response.status}`;
        try {
            const errorData = JSON.parse(errorBody);
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            }
        } catch (e) {
        }

        if (response.status === 401) {
            throw new Error('Authentication expired. Please sign out and sign in again to refresh your Google Drive access.');
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
}

async function findExistingFile(accessToken, filename) {
    try {
        const q = `name = '${filename.replace(/'/g, "\\'")}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id;
            }
        }
    } catch (e) {
        console.error("Error searching for file:", e);
    }
    return null;
}
