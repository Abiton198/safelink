/**
 * components/dashboard/VehiclesTab.tsx
 * ---------------------------------------------------------------------------
 * Two cards:
 *   1. A form to add a vehicle and its tracker details
 *   2. The list of saved vehicles, each with a Delete button
 *
 * Saving/deleting logic lives in Dashboard.tsx.
 */
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Vehicle } from "../../types";
import type { VehicleForm } from "./components/dashboard/dashboardConfig";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Empty } from "../ui/Empty";

type VehiclesTabProps = {
  vehicles: Vehicle[];
  form: VehicleForm;
  setForm: Dispatch<SetStateAction<VehicleForm>>;
  busy: boolean;
  onAdd: (e: FormEvent) => void;
  onDelete: (id: string) => void;
};

export function VehiclesTab({
  vehicles,
  form,
  setForm,
  busy,
  onAdd,
  onDelete,
}: VehiclesTabProps) {
  return (
    <>
      {/* ---------- Add vehicle ---------- */}
      <Card
        title="Vehicles & trackers"
        subtitle="Add information that may help with vehicle recovery."
      >
        <form onSubmit={onAdd} className="form-grid">
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

          <div className="form-actions">
            <button className="button primary" disabled={busy}>
              Add vehicle
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
