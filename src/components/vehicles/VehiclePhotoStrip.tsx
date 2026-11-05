/**
 * components/vehicles/VehiclePhotoStrip.tsx
 * ---------------------------------------------------------------------------
 * The photos of one SAVED vehicle: thumbnails with a remove button, plus an
 * "Add" tile until the limit of 5 is reached.
 *
 * It only DISPLAYS and reports actions. Uploading and deleting are done by
 * whoever uses it (the dashboard or the onboarding wizard) via the callbacks.
 */
import { useRef } from "react";
import type { Vehicle } from "../../types";
import { MAX_VEHICLE_IMAGES, imagesOf } from "../../lib/vehicleImages";
import "../../styles/vehicle-photos.css";

type Props = {
    vehicle: Vehicle;
    /** True while something is being saved (disables the controls). */
    busy: boolean;
    /** Called with the chosen photos (already limited to the room left). */
    onUpload: (files: File[]) => void | Promise<void>;
    /** Called with the id of the photo to remove. */
    onDelete: (imageId: string) => void;
};

export function VehiclePhotoStrip({ vehicle, busy, onUpload, onDelete }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const images = imagesOf(vehicle);
    const remaining = MAX_VEHICLE_IMAGES - images.length;

    async function onPick(files: FileList | null) {
        const chosen = Array.from(files ?? [])
            .filter((file) => file.type.startsWith("image/"))
            .slice(0, remaining);

        if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
        if (chosen.length) await onUpload(chosen);
    }

    return (
        <div className="ob-photos" aria-label={`Photos of ${vehicle.label}`}>
            {images.map((image, index) => (
                <div className="ob-photo" key={image.image_id}>
                    {image.url ? (
                        <img src={image.url} alt={`${vehicle.label} photo ${index + 1}`} />
                    ) : (
                        <span aria-hidden="true">📷</span>
                    )}
                    <button
                        type="button"
                        aria-label={`Remove photo ${index + 1}`}
                        disabled={busy}
                        onClick={() => onDelete(image.image_id)}
                    >
                        ✕
                    </button>
                </div>
            ))}

            {remaining > 0 && (
                <label className={busy ? "ob-photo-add disabled" : "ob-photo-add"}>
                    <span aria-hidden="true">＋</span>
                    <small>
                        Photo {images.length}/{MAX_VEHICLE_IMAGES}
                    </small>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={busy}
                        onChange={(e) => void onPick(e.target.files)}
                    />
                </label>
            )}
        </div>
    );
}