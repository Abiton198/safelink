/**
 * components/onboarding/StepContacts.tsx
 * ---------------------------------------------------------------------------
 * Slide 3: add one or more emergency contacts.
 *
 * "Add contact" saves right away and the contact appears in the list above
 * the form, so several can be added in a row.
 *
 * If a contact has been typed in but "Add contact" was not pressed, pressing
 * Continue (or Back / Save & exit) SAVES it first: the wizard calls `flush`
 * below, so nothing typed is silently lost. A contact needs a name and a phone
 * number; if one is missing the person stays on the slide and is told why.
 */
import { useEffect, useState, type FormEvent } from "react";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import {
    EMPTY_CONTACT_FORM,
    type ContactForm,
} from "../dashboard/dashboardConfig";
import { Field } from "../ui/Field";
import type { RegisterFlush } from "./onboardingConfig";

type Props = {
    ob: OnboardingApi;
    /** Lets the wizard save a half-finished form before leaving this slide. */
    registerFlush: RegisterFlush;
};

export function StepContacts({ ob, registerFlush }: Props) {
    const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT_FORM);
    const [formProblem, setFormProblem] = useState("");

    // Anything typed that is not saved yet? (the checkbox alone does not count)
    const dirty = [form.name, form.phone, form.relationship, form.email].some(
        (v) => v.trim() !== ""
    );

    function clearForm() {
        setForm(EMPTY_CONTACT_FORM);
        setFormProblem("");
    }

    /** Saves the contact. True if saved. */
    async function saveContact(): Promise<boolean> {
        // Next free priority number (1 = called first, maximum 5)
        const priority = String(Math.min(5, ob.contacts.length + 1));
        if (await ob.addContact({ ...form, priority })) {
            clearForm();
            return true;
        }
        return false; // the error is already shown
    }

    /** The "＋ Add contact" button. */
    async function submit(e: FormEvent) {
        e.preventDefault();
        await saveContact();
    }

    /** Called by the wizard before it leaves this slide. True = fine to leave. */
    async function flush(): Promise<boolean> {
        if (!dirty) return true;

        if (!form.name.trim() || !form.phone.trim()) {
            setFormProblem(
                "A contact needs a name and a phone number. Fill both in, or press “Clear form” to leave it out."
            );
            return false;
        }

        return saveContact();
    }

    // Keep the wizard pointing at the CURRENT flush (it sees the latest form).
    useEffect(() => {
        registerFlush(flush);
        return () => registerFlush(null);
    });

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
                        onChange={(e) => { setFormProblem(""); setForm({ ...form, name: e.target.value }); }}
                    />
                </Field>

                <Field label="Phone number">
                    <input
                        required
                        type="tel"
                        maxLength={30}
                        autoComplete="off"
                        value={form.phone}
                        onChange={(e) => { setFormProblem(""); setForm({ ...form, phone: e.target.value }); }}
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

                {formProblem && (
                    <p className="ob-photo-note" role="alert">
                        {formProblem}
                    </p>
                )}

                <button className="ob-btn accent" disabled={ob.busy}>
                    {ob.busy ? "Saving…" : "＋ Add contact"}
                </button>

                {dirty && (
                    <>
                        <p className="ob-hint">
                            Not pressed “Add contact”? No problem: pressing Continue saves what
                            you typed.
                        </p>
                        <button type="button" className="ob-link" onClick={clearForm}>
                            Clear form
                        </button>
                    </>
                )}
            </form>
        </>
    );
}