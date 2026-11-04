/**
 * components/onboarding/StepVehicle.tsx
 * ---------------------------------------------------------------------------
 * Slide 4: add a vehicle, its tracker and up to 5 photos (all optional).
 *
 * "Add vehicle" saves the vehicle first, then uploads the chosen photos to it.
 * Saved vehicles appear in the list above the form, where more photos can be
 * added or removed later (VehiclePhotos).
 *
 * Photos are shrunk in the browser (utils/resizeImage.ts) and checked again
 * by the backend, which enforces the limit of 5 per vehicle.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import { MAX_VEHICLE_IMAGES } from "../../lib/vehicleImages";
import {
    EMPTY_VEHICLE_FORM,
    type VehicleForm,
} from "../dashboard/dashboardConfig";
import { Field } from "../ui/Field";
import { VehiclePhotos } from "./VehiclePhotos";

export function StepVehicle({ ob }: { ob: OnboardingApi }) {
    const [form, setForm] = useState<VehicleForm>(EMPTY_VEHICLE_FORM);

    // Photos chosen for the vehicle being added (uploaded after it is saved)
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoNote, setPhotoNote] = useState("");

    const set = (key: keyof VehicleForm, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    // Small previews of the chosen photos, released when no longer needed.
    const previews = useMemo(
        () => photos.map((file) => URL.createObjectURL(file)),
        [photos]
    );
    useEffect(
        () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
        [previews]
    );

    /** Adds picked files, keeping the total at the limit. */
    function pickPhotos(files: FileList | null) {
        const images = Array.from(files ?? []).filter((file) =>
            file.type.startsWith("image/")
        );

        const room = MAX_VEHICLE_IMAGES - photos.length;
        setPhotoNote(
            images.length > room
                ? `Only ${MAX_VEHICLE_IMAGES} photos per vehicle. Extra photos were not added.`
                : ""
        );

        setPhotos((current) => [...current, ...images.slice(0, room)]);
    }

    async function submit(e: FormEvent) {
        e.preventDefault();

        const vehicleId = await ob.addVehicle(form);
        if (!vehicleId) return; // the error is already shown

        if (photos.length > 0) await ob.uploadVehicleImages(vehicleId, photos);

        setForm(EMPTY_VEHICLE_FORM);
        setPhotos([]);
        setPhotoNote("");
    }

    return (
        <>
            {ob.vehicles.length > 0 && (
                <ul className="ob-chips" aria-label="Saved vehicles">
                    {ob.vehicles.map((vehicle) => (
                        <li key={vehicle.vehicle_id} className="ob-chip ob-chip-col">
                            <div className="ob-chip-row">
                                <span>
                                    <strong>{vehicle.label}</strong>
                                    <small>
                                        {[vehicle.make, vehicle.model, vehicle.registration_number]
                                            .filter(Boolean)
                                            .join(" · ") || "Vehicle"}
                                    </small>
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Remove ${vehicle.label}`}
                                    onClick={() => void ob.deleteVehicle(vehicle.vehicle_id)}
                                >
                                    ✕
                                </button>
                            </div>

                            <VehiclePhotos vehicle={vehicle} ob={ob} />
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit}>
                <Field label="Name for this vehicle">
                    <input
                        required
                        maxLength={80}
                        value={form.label}
                        onChange={(e) => set("label", e.target.value)}
                        placeholder="My car"
                    />
                </Field>

                <div className="ob-row">
                    <Field label="Make">
                        <input
                            maxLength={60}
                            value={form.make}
                            onChange={(e) => set("make", e.target.value)}
                        />
                    </Field>
                    <Field label="Model">
                        <input
                            maxLength={60}
                            value={form.model}
                            onChange={(e) => set("model", e.target.value)}
                        />
                    </Field>
                </div>

                <div className="ob-row">
                    <Field label="Colour">
                        <input
                            maxLength={40}
                            value={form.colour}
                            onChange={(e) => set("colour", e.target.value)}
                        />
                    </Field>
                    <Field label="Registration">
                        <input
                            maxLength={30}
                            value={form.registration_number}
                            onChange={(e) => set("registration_number", e.target.value)}
                        />
                    </Field>
                </div>

                <div className="ob-row">
                    <Field label="Tracker provider">
                        <input
                            maxLength={100}
                            value={form.tracker_provider}
                            onChange={(e) => set("tracker_provider", e.target.value)}
                        />
                    </Field>
                    <Field label="Tracker reference">
                        <input
                            maxLength={100}
                            value={form.tracker_reference}
                            onChange={(e) => set("tracker_reference", e.target.value)}
                        />
                    </Field>
                </div>

                {/* ---------- Photos (optional, up to 5) ---------- */}
                <div className="ob-field-label">
                    Photos (optional, up to {MAX_VEHICLE_IMAGES})
                </div>

                <div className="ob-photos">
                    {previews.map((url, index) => (
                        <div className="ob-photo" key={url}>
                            <img src={url} alt={`Chosen photo ${index + 1}`} />
                            <button
                                type="button"
                                aria-label={`Remove chosen photo ${index + 1}`}
                                onClick={() =>
                                    setPhotos((current) => current.filter((_, i) => i !== index))
                                }
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {photos.length < MAX_VEHICLE_IMAGES && (
                        <label className="ob-photo-add">
                            <span aria-hidden="true">📷</span>
                            <small>
                                {photos.length}/{MAX_VEHICLE_IMAGES}
                            </small>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    pickPhotos(e.target.files);
                                    e.target.value = ""; // allow picking the same file again
                                }}
                            />
                        </label>
                    )}
                </div>

                {photoNote && <p className="ob-photo-note">{photoNote}</p>}

                <button className="ob-btn accent" disabled={ob.busy}>
                    {ob.busy
                        ? photos.length > 0
                            ? "Saving and uploading…"
                            : "Saving…"
                        : "＋ Add vehicle"}
                </button>
            </form>
        </>
    );
}