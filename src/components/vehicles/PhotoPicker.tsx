/**
 * components/vehicles/PhotoPicker.tsx
 * ---------------------------------------------------------------------------
 * Choose up to 5 photos for a vehicle that is about to be SAVED.
 * Shows small previews with a remove button. The chosen files are held by the
 * parent form (`files`) and uploaded after the vehicle has been saved.
 */
import { useEffect, useMemo, useState } from "react";
import { MAX_VEHICLE_IMAGES } from "../../lib/vehicleImages";
import "../../styles/vehicle-photos.css";

type Props = {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
};

export function PhotoPicker({ files, onChange, disabled = false }: Props) {
    const [note, setNote] = useState("");

    // Previews are released when no longer needed (avoids leaking memory).
    const previews = useMemo(
        () => files.map((file) => URL.createObjectURL(file)),
        [files]
    );
    useEffect(
        () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
        [previews]
    );

    function pick(list: FileList | null) {
        const images = Array.from(list ?? []).filter((file) =>
            file.type.startsWith("image/")
        );
        const room = MAX_VEHICLE_IMAGES - files.length;

        setNote(
            images.length > room
                ? `Only ${MAX_VEHICLE_IMAGES} photos per vehicle. Extra photos were not added.`
                : ""
        );
        onChange([...files, ...images.slice(0, room)]);
    }

    return (
        <>
            <div className="ob-photos">
                {previews.map((url, index) => (
                    <div className="ob-photo" key={url}>
                        <img src={url} alt={`Chosen photo ${index + 1}`} />
                        <button
                            type="button"
                            aria-label={`Remove chosen photo ${index + 1}`}
                            disabled={disabled}
                            onClick={() => onChange(files.filter((_, i) => i !== index))}
                        >
                            ✕
                        </button>
                    </div>
                ))}

                {files.length < MAX_VEHICLE_IMAGES && (
                    <label className={disabled ? "ob-photo-add disabled" : "ob-photo-add"}>
                        <span aria-hidden="true">📷</span>
                        <small>
                            {files.length}/{MAX_VEHICLE_IMAGES}
                        </small>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={disabled}
                            onChange={(e) => {
                                pick(e.target.files);
                                e.target.value = ""; // allow picking the same file again
                            }}
                        />
                    </label>
                )}
            </div>

            {note && <p className="vp-note">{note}</p>}
        </>
    );
}