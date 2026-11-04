/**
 * utils/resizeImage.ts
 * ---------------------------------------------------------------------------
 * Shrinks a photo in the browser BEFORE it is uploaded.
 *
 * Phone cameras produce 5-12 MB pictures. Uploading those over mobile data is
 * slow and expensive, so each photo is scaled so its longest side is at most
 * 1600 px and saved as a JPEG (usually 200-500 KB).
 *
 * Re-drawing on a canvas also drops hidden metadata such as GPS location.
 * (The backend does this again, so it never depends on the browser.)
 */

export async function resizeImage(
    file: File,
    maxSide = 1600,
    quality = 0.85
): Promise<File> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file.");
    }

    // Ask for the phone's rotation to be applied; fall back for older browsers.
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        try {
            bitmap = await createImageBitmap(file);
        } catch {
            throw new Error("That image could not be read. Try a JPG or PNG photo.");
        }
    }

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        bitmap.close();
        throw new Error("Could not process that image.");
    }

    // JPEG has no transparency: paint white first.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) throw new Error("Could not process that image.");

    return new File([blob], "vehicle.jpg", { type: "image/jpeg" });
}