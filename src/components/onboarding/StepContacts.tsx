/**
 * components/onboarding/StepContacts.tsx
 * ---------------------------------------------------------------------------
 * Slide 3: add one or more emergency contacts.
 *
 * "Add contact" saves right away and the contact appears in the list above
 * the form, so several can be added in a row. The footer "Continue" button
 * simply moves to the next slide.
 */
import { useState, type FormEvent } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import {
    EMPTY_CONTACT_FORM,
    type ContactForm,
} from "../dashboard/dashboardConfig";
import { Field } from "../ui/Field";

export function StepContacts({ ob }: { ob: OnboardingApi }) {
    const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT_FORM);

    async function submit(e: FormEvent) {
        e.preventDefault();
        // Next free priority number (1 = called first, maximum 5)
        const priority = String(Math.min(5, ob.contacts.length + 1));
        if (await ob.addContact({ ...form, priority })) {
            setForm(EMPTY_CONTACT_FORM);
        }
    }

    return (
        <>
            {ob.contacts.length > 0 && (
                <ul className="ob-chips" aria-label="Saved contacts">
                    {ob.contacts.map((contact) => (
                        <li key={contact.contact_id} className="ob-chip">
                            <span>
                                <strong>{contact.name}</strong>
                                <small>
                                    {contact.relationship || "Contact"} · {contact.phone}
                                </small>
                            </span>
                            <button
                                type="button"
                                aria-label={`Remove ${contact.name}`}
                                onClick={() => void ob.deleteContact(contact.contact_id)}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit}>
                <Field label="Contact name">
                    <input
                        required
                        maxLength={100}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                </Field>

                <Field label="Phone number">
                    <input
                        required
                        type="tel"
                        maxLength={30}
                        autoComplete="off"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                </Field>

                <Field label="Relationship (optional)">
                    <input
                        maxLength={60}
                        value={form.relationship}
                        onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                        placeholder="Family, friend…"
                    />
                </Field>

                <label className="ob-check">
                    <input
                        type="checkbox"
                        checked={form.share_with_responder}
                        onChange={(e) =>
                            setForm({ ...form, share_with_responder: e.target.checked })
                        }
                    />
                    Show to verified responders
                </label>

                <button className="ob-btn accent" disabled={ob.busy}>
                    {ob.busy ? "Saving…" : "＋ Add contact"}
                </button>
            </form>
        </>
    );
}