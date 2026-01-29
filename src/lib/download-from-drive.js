export async function downloadFromDrive(accessToken, fileId) {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to download file: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return await response.blob();
}
