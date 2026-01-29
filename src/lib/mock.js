export const mockGoogleLogin = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                name: "Demo User",
                email: "user@example.com",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                accessToken: "mock_google_access_token_123"
            });
        }, 1000);
    });
};

export const mockDrivePicker = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockImages = [
                {
                    id: `img_${Date.now()}_1`,
                    name: "vacation_photo.jpg",
                    thumbnail: "https://picsum.photos/seed/vacation/300/200", // Placeholders
                    status: 'idle',
                    progress: 0
                },
                {
                    id: `img_${Date.now()}_2`,
                    name: "product_shot.png",
                    thumbnail: "https://picsum.photos/seed/product/300/200",
                    status: 'idle',
                    progress: 0
                },
            ];
            resolve(mockImages);
        }, 1500);
    });
};

export const mockProcessImage = async (fileId, onProgress) => {
    return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            onProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, 300);
    });
};
