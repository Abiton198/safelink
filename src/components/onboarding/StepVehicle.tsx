/**
 * components/onboarding/StepVehicle.tsx
 * ---------------------------------------------------------------------------
 * Slide 4: add a vehicle and tracker (optional).
 * Works like the contacts slide: "Add vehicle" saves immediately and the
 * vehicle shows in the list above the form.
 */
import { useState, type FormEvent } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import {
    EMPTY_VEHICLE_FORM,
    type VehicleForm,
} from "../dashboard/dashboardConfig";
import { Field } from "../ui/Field";

export function StepVehicle({ ob }: { ob: OnboardingApi }) {
    const [form, setForm] = useState<VehicleForm>(EMPTY_VEHICLE_FORM);

    const set = (key: keyof VehicleForm, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (await ob.addVehicle(form)) setForm(EMPTY_VEHICLE_FORM);
    }

    return (
        <>
            {ob.vehicles.length > 0 && (
                <ul className="ob-chips" aria-label="Saved vehicles">
                    {ob.vehicles.map((vehicle) => (
                        <li key={vehicle.vehicle_id} className="ob-chip">
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

                <button className="ob-btn accent" disabled={ob.busy}>
                    {ob.busy ? "Saving…" : "＋ Add vehicle"}
                </button>
            </form>
        </>
    );
}