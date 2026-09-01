export async function compressImage(file, { maxWidth = 480, maxHeight = 480, quality = 0.78 } = {}) {
    if (!file || !file.type?.startsWith("image/")) {
        throw new Error("Please select a valid image file.");
    }
    const dataUrl = await readFile(file);
    const image = await loadImage(dataUrl);
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
}
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read the image."));
        reader.readAsDataURL(file);
    });
}
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to process the image."));
        image.src = src;
    });
}

