export async function loadImage(source) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
        img.onload = async () => {
            try {
                await img.decode().catch(() => { });
                resolve(img);
            } catch (error) {
                resolve(img);
            }
        };

        img.onerror = (e) => {
            reject(new Error(`Failed to load image: ${e.message || 'Unknown error'}`));
        };

        if (source instanceof Blob) {
            img.src = URL.createObjectURL(source);
        } else {
            img.src = source;
        }
    });
}

export function calculateAverageResolution(images) {
    if (images.length === 0) {
        throw new Error('No images provided');
    }

    const totalWidth = images.reduce((sum, img) => sum + img.naturalWidth, 0);
    const totalHeight = images.reduce((sum, img) => sum + img.naturalHeight, 0);

    return {
        width: Math.round(totalWidth / images.length),
        height: Math.round(totalHeight / images.length)
    };
}

export function resizeImage(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas;
}

export async function applyTemplate(imageBlob, templateBlob, width, height) {
    const [image, template] = await Promise.all([
        loadImage(imageBlob),
        loadImage(templateBlob)
    ]);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image first (background)
    ctx.drawImage(image, 0, 0, width, height);

    // Draw template on top (overlay)
    ctx.drawImage(template, 0, 0, width, height);

    // Export as JPEG with high quality (0.95)
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
    });
}

export async function processImagesWithTemplate(files, templateBlob, onProgress) {
    if (!files || files.length === 0) {
        throw new Error('No files to process');
    }

    if (!templateBlob) {
        throw new Error('No template provided');
    }


    const processedFiles = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (onProgress) {
            onProgress(i + 1, files.length);
        }

        const img = await loadImage(file.blob);
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        console.log(`Processing image ${i + 1}/${files.length}: ${width}x${height}`);

        const processedBlob = await applyTemplate(
            file.blob,
            templateBlob,
            width,
            height
        );

        processedFiles.push({
            blob: processedBlob,
            name: file.name.replace(/\.[^/.]+$/, '') + '_processed.png'
        });
    }

    return processedFiles;
}

export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) {
    const image = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const rotRad = (rotation * Math.PI) / 180;

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    // As Base64 (for preview) or Blob (for upload)
    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, 'image/jpeg', 0.95);
    });
}

function rotateSize(width, height, rotation) {
    const rotRad = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

export async function compressImageToLimit(blob, limitBytes) {
    if (blob.size <= limitBytes) {
        let ext = 'png';
        if (blob.type === 'image/jpeg') ext = 'jpg';
        if (blob.type === 'image/webp') ext = 'webp';
        return { blob, ext };
    }

    console.log(`Image size ${blob.size} exceeds limit ${limitBytes}, compressing...`);

    const img = await loadImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Strategy 1: WebP High Quality (Good compression, supports transparency)
    let newBlob = await new Promise(r => canvas.toBlob(r, 'image/webp', 0.90));
    if (newBlob && newBlob.size <= limitBytes) {
        console.log(`Compressed to WebP (0.90): ${newBlob.size}`);
        return { blob: newBlob, ext: 'webp' };
    }

    // Strategy 2: JPEG High Quality (No transparency)
    newBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.90));
    if (newBlob && newBlob.size <= limitBytes) {
        console.log(`Compressed to JPEG (0.90): ${newBlob.size}`);
        return { blob: newBlob, ext: 'jpg' };
    }

    // Strategy 3: Aggressive JPEG (0.75 quality)
    newBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.75));
    if (newBlob && newBlob.size <= limitBytes) {
        console.log(`Compressed to JPEG (0.75): ${newBlob.size}`);
        return { blob: newBlob, ext: 'jpg' };
    }

    newBlob = await new Promise(r => canvas.toBlob(r, 'image/webp', 0.75));
    if (newBlob && newBlob.size <= limitBytes) {
        console.log(`Compressed to WebP (0.75): ${newBlob.size}`);
        return { blob: newBlob, ext: 'webp' };
    }

    console.warn(`Failed to compress under limit. Final size: ${newBlob.size}`);
    return { blob: newBlob, ext: 'webp' };
}
