/**
 * components/onboarding/VehiclePhotos.tsx
 * ---------------------------------------------------------------------------
 * The photo strip under a SAVED vehicle: thumbnails with a remove button, and
 * an "Add" tile until the limit of 5 is reached.
 */
import { useRef } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import type { Vehicle } from "../../types";
import { MAX_VEHICLE_IMAGES, imagesOf } from "../../lib/vehicleImages";

type Props = {
    vehicle: Vehicle;
    ob: OnboardingApi;
};

export function VehiclePhotos({ vehicle, ob }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const images = imagesOf(vehicle);
    const remaining = MAX_VEHICLE_IMAGES - images.length;

    /** Uploads the chosen files, never more than the room left. */
    async function onPick(files: FileList | null) {
        const chosen = Array.from(files ?? [])
            .filter((file) => file.type.startsWith("image/"))
            .slice(0, remaining);

        if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
        if (chosen.length) await ob.uploadVehicleImages(vehicle.vehicle_id, chosen);
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
                        disabled={ob.busy}
                        onClick={() =>
                            void ob.deleteVehicleImage(vehicle.vehicle_id, image.image_id)
                        }
                    >
                        ✕
                    </button>
                </div>
            ))}

            {remaining > 0 && (
                <label className={ob.busy ? "ob-photo-add disabled" : "ob-photo-add"}>
                    <span aria-hidden="true">＋</span>
                    <small>
                        Photo {images.length}/{MAX_VEHICLE_IMAGES}
                    </small>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={ob.busy}
                        onChange={(e) => void onPick(e.target.files)}
                    />
                </label>
            )}
        </div>
    );
}