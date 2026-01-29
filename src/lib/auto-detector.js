
export const ASPECT_RATIO_TYPES = {
    SQUARE: { label: "Square", ratio: 1, tolerance: 0.1 },
    PORTRAIT: { label: "Portrait", ratio: 0.8, tolerance: 0.15 },
    LANDSCAPE: { label: "Landscape", ratio: 1.91, tolerance: 0.5 },
    STORY: { label: "Story", ratio: 0.5625, tolerance: 0.1 }
};

export const detectImageProperties = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const ratio = width / height;

            let type = "Calculated";
            let bestMatch = "Landscape";
            let minDiff = Infinity;

            Object.entries(ASPECT_RATIO_TYPES).forEach(([key, config]) => {
                const diff = Math.abs(ratio - config.ratio);
                if (diff < minDiff && diff <= config.tolerance) {
                    minDiff = diff;
                    bestMatch = config.label;
                }
            });

            if (minDiff > 0.2) {
                if (ratio > 1.2) bestMatch = "Landscape";
                else if (ratio < 0.8) bestMatch = "Portrait";
                else bestMatch = "Square";
            }

            URL.revokeObjectURL(objectUrl);
            resolve({
                width,
                height,
                aspectRatio: ratio,
                type: bestMatch
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                width: 0, height: 0, aspectRatio: 1, type: "Unknown"
            });
        };

        img.src = objectUrl;
    });
};

export const groupFilesByType = async (files) => {
    const groups = {};

    Object.values(ASPECT_RATIO_TYPES).forEach(t => groups[t.label] = []);
    groups["Unknown"] = [];

    for (const fileItem of files) {
        // otherwise calculate (this assumes fileItem has a 'file' object which is the actual Blob/File for local uploads)

        let fileType = fileItem.orientation || "Unknown";

        if (!fileItem.orientation && fileItem.blob) {
            const props = await detectImageProperties(fileItem.blob);
            fileType = props.type;
        } else if (!fileItem.orientation && fileItem.imageMediaMetadata) {
            const width = fileItem.imageMediaMetadata.width;
            const height = fileItem.imageMediaMetadata.height;
            const ratio = width / height;
            if (ratio > 1.2) fileType = "Landscape";
            else if (ratio < 0.8) fileType = "Portrait";
            else fileType = "Square";
        }

        if (!groups[fileType]) groups[fileType] = [];
        groups[fileType].push(fileItem);
    }

    return groups;
};
