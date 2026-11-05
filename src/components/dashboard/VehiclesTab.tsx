/**
 * components/dashboard/VehiclesTab.tsx
 * ---------------------------------------------------------------------------
 * Two cards:
 *   1. A form to add a vehicle, its tracker details and up to 5 photos
 *   2. The list of saved vehicles, each with its photos (add / remove) and a
 *      Delete button
 *
 * Saving, uploading and deleting logic lives in Dashboard.tsx.
 * Photos are limited to 5 per vehicle (the backend enforces this too).
 */
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Vehicle } from "../../types";
import type { VehicleForm } from "./dashboardConfig";
import { MAX_VEHICLE_IMAGES } from "../../lib/vehicleImages";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Empty } from "../ui/Empty";
import { PhotoPicker } from "../vehicles/PhotoPicker";
import { VehiclePhotoStrip } from "../vehicles/VehiclePhotoStrip";

type VehiclesTabProps = {
  vehicles: Vehicle[];
  form: VehicleForm;
  setForm: Dispatch<SetStateAction<VehicleForm>>;
  busy: boolean;
  /** Saves the vehicle, then uploads `photos` to it. Resolves true if saved. */
  onAdd: (e: FormEvent, photos: File[]) => Promise<boolean>;
  onDelete: (id: string) => void;
  /** Adds photos to a vehicle that is already saved. */
  onUploadImages: (vehicleId: string, files: File[]) => Promise<void>;
  /** Removes one photo from a saved vehicle. */
  onDeleteImage: (vehicleId: string, imageId: string) => void;
};

export function VehiclesTab({
  vehicles,
  form,
  setForm,
  busy,
  onAdd,
  onDelete,
  onUploadImages,
  onDeleteImage,
}: VehiclesTabProps) {
  // Photos chosen for the vehicle being added (uploaded after it is saved)
  const [photos, setPhotos] = useState<File[]>([]);

  async function submit(e: FormEvent) {
    const saved = await onAdd(e, photos);
    if (saved) setPhotos([]);
  }

  return (
    <>
      {/* ---------- Add vehicle ---------- */}
      <Card
        title="Vehicles & trackers"
        subtitle="Add information that may help with vehicle recovery."
      >
        <form onSubmit={submit} className="form-grid">
          <Field label="Label">
            <input
              required
              maxLength={80}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="My car"
            />
          </Field>

          <Field label="Make">
            <input
              maxLength={60}
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
            />
          </Field>

          <Field label="Model">
            <input
              maxLength={60}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </Field>

          <Field label="Colour">
            <input
              maxLength={40}
              value={form.colour}
              onChange={(e) => setForm({ ...form, colour: e.target.value })}
            />
          </Field>

          <Field label="Registration number">
            <input
              maxLength={30}
              value={form.registration_number}
              onChange={(e) =>
                setForm({ ...form, registration_number: e.target.value })
              }
            />
          </Field>

          <Field label="Tracker provider">
            <input
              maxLength={100}
              value={form.tracker_provider}
              onChange={(e) =>
                setForm({ ...form, tracker_provider: e.target.value })
              }
            />
          </Field>

          <Field label="Tracker reference">
            <input
              maxLength={100}
              value={form.tracker_reference}
              onChange={(e) =>
                setForm({ ...form, tracker_reference: e.target.value })
              }
            />
          </Field>

          <Field label="Additional notes">
            <textarea
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          {/* Photos: full width, whatever the form grid looks like */}
          <div style={{ gridColumn: "1 / -1" }}>
            <span className="vp-label">
              Photos (optional, up to {MAX_VEHICLE_IMAGES})
            </span>
            <PhotoPicker files={photos} onChange={setPhotos} disabled={busy} />
          </div>

          <div className="form-actions">
            <button className="button primary" disabled={busy}>
              {busy && photos.length > 0 ? "Saving and uploading…" : "Add vehicle"}
            </button>
          </div>
        </form>
      </Card>

      {/* ---------- Saved vehicles ---------- */}
      <Card title={`Saved vehicles (${vehicles.length})`}>
        {vehicles.length ? (
          <div className="record-list">
            {vehicles.map((vehicle) => (
              <div className="record" key={vehicle.vehicle_id}>
                <div className="record-icon">◇</div>
                <div className="record-main">
                  <strong>{vehicle.label}</strong>
                  <span>
                    {/* Join make · model · colour, skipping any blank ones */}
                    {[vehicle.make, vehicle.model, vehicle.colour]
                      .filter(Boolean)
                      .join(" · ") || "Vehicle details"}
                  </span>
                  <small>
                    {vehicle.registration_number || "No registration entered"}
                    {vehicle.tracker_provider
                      ? ` · ${vehicle.tracker_provider}`
                      : ""}
                  </small>

                  <VehiclePhotoStrip
                    vehicle={vehicle}
                    busy={busy}
                    onUpload={(files) =>
                      onUploadImages(vehicle.vehicle_id, files)
                    }
                    onDelete={(imageId) =>
                      onDeleteImage(vehicle.vehicle_id, imageId)
                    }
                  />
                </div>

                <button
                  className="button danger small"
                  onClick={() => onDelete(vehicle.vehicle_id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="No vehicles added yet." />
        )}
      </Card>
    </>
  );
}