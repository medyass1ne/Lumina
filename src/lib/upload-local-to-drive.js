import { detectImageProperties } from "./auto-detector";

export async function uploadLocalToDrive(accessToken, files) {
    const uploadedFiles = [];

    for (const file of files) {
        try {
            if (!file.type.startsWith('image/')) {
                console.warn(`Skipping non-image file: ${file.name}`);
                continue;
            }

            const props = await detectImageProperties(file);

            const metadata = {
                name: file.name,
                mimeType: file.type,
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink,imageMediaMetadata', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: form,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Upload failed for ${file.name}:`, errorBody);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const localPreviewUrl = URL.createObjectURL(file);

            uploadedFiles.push({
                id: data.id,
                name: data.name,
                thumbnail: data.thumbnailLink || localPreviewUrl,
                previewUrl: localPreviewUrl,
                mimeType: data.mimeType,
                status: 'idle',
                source: 'drive',
                progress: 0,
                orientation: props.type,
                aspectRatio: props.aspectRatio,
                width: props.width,
                height: props.height,
                driveMetadata: data.imageMediaMetadata
            });
        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            throw error;
        }
    }

    return uploadedFiles;
}
