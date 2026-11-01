/**
 * components/onboarding/StepTag.tsx
 * ---------------------------------------------------------------------------
 * Slide 5: claim the physical tag using the reference and the concealed
 * activation code that came with it. Tags cannot be created here; only tags
 * the business has marked as sold can be claimed.
 */
import { useState, type FormEvent } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import { EMPTY_CLAIM_FORM, type ClaimForm } from "../dashboard/dashboardConfig";
import { Field } from "../ui/Field";

export function StepTag({ ob }: { ob: OnboardingApi }) {
    const [form, setForm] = useState<ClaimForm>(EMPTY_CLAIM_FORM);

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (await ob.claimTag(form)) setForm(EMPTY_CLAIM_FORM);
    }

    return (
        <>
            {ob.tags.length > 0 && (
                <ul className="ob-chips" aria-label="Claimed tags">
                    {ob.tags.map((tag) => (
                        <li key={tag.qr_id} className="ob-chip">
                            <span>
                                <strong>{tag.label}</strong>
                                <small>{tag.active ? "Active" : "Deactivated"}</small>
                            </span>
                            <span aria-hidden="true">{tag.active ? "✅" : "⏸"}</span>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit}>
                <Field label="Tag reference">
                    <input
                        required
                        maxLength={40}
                        autoComplete="off"
                        autoCapitalize="characters"
                        value={form.tag_ref}
                        onChange={(e) =>
                            setForm({ ...form, tag_ref: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g. SL-000001"
                    />
                </Field>

                <Field label="Activation code (keep private)">
                    <input
                        required
                        maxLength={100}
                        autoComplete="off"
                        value={form.activation_code}
                        onChange={(e) =>
                            setForm({ ...form, activation_code: e.target.value })
                        }
                    />
                </Field>

                <Field label="Tag name (optional)">
                    <input
                        maxLength={80}
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        placeholder="My watch tag"
                    />
                </Field>

                <button className="ob-btn accent" disabled={ob.busy}>
                    {ob.busy ? "Claiming…" : "🏷️ Claim tag"}
                </button>
            </form>

            <p className="ob-hint">
                Don't have your tag yet? Skip this step and claim it later from your
                dashboard.
            </p>
        </>
    );
}