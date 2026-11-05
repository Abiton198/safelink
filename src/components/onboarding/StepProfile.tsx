/**
 * components/onboarding/StepProfile.tsx
 * ---------------------------------------------------------------------------
 * Slide 2: the owner's emergency profile.
 *
 * The form has an id ("ob-profile-form"). The big button in the footer of
 * pages/Onboarding.tsx points at that id (`form="ob-profile-form"`), so
 * pressing "Save & continue" submits this form.
 *
 * Date of birth is required: the backend uses it to verify the person who
 * scans the tag. It is never read back, so it always starts empty.
 */
import { useState, type FormEvent } from "react";
import { useAuth } from "../../auth";
import type { OnboardingApi } from "../../hooks/useOnboarding";
import { Field } from "../ui/Field";
import DateOfBirthInput from "./DateOfBirthInput";

type Props = {
    ob: OnboardingApi;
    /** Called after a successful save so the wizard can move on. */
    onSaved: () => void;
};

export function StepProfile({ ob, onSaved }: Props) {
    const { user } = useAuth();

    const [values, setValues] = useState({
        display_name: ob.profile?.display_name || user?.displayName || "",
        date_of_birth: "",
        emergency_summary: ob.profile?.emergency_summary || "",
        medical_notes: ob.profile?.medical_notes || "",
        preferred_language: ob.profile?.preferred_language || "en",
    });

    // Small helper so every input updates one field
    const set = (key: keyof typeof values, value: string) =>
        setValues((current) => ({ ...current, [key]: value }));

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (await ob.saveProfile(values)) onSaved();
    }

    return (
        <form id="ob-profile-form" onSubmit={submit}>
            <Field label="Your name">
                <input
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={values.display_name}
                    onChange={(e) => set("display_name", e.target.value)}
                />
            </Field>

            <Field label="Date of birth (used to verify scans)">
                <DateOfBirthInput
                    required
                    value={values.date_of_birth}
                    onChange={(iso) => set("date_of_birth", iso)}
                    autoFocus

                />
            </Field>

            <Field label="Language">
                <select
                    value={values.preferred_language}
                    onChange={(e) => set("preferred_language", e.target.value)}
                >
                    <option value="en">English</option>
                    <option value="af">Afrikaans</option>
                    <option value="zu">isiZulu</option>
                    <option value="xh">isiXhosa</option>
                    <option value="st">Sesotho</option>
                    <option value="tn">Setswana</option>
                    <option value="sn">Shona</option>
                </select>
            </Field>

            <Field label="What should a responder know first?">
                <textarea
                    rows={3}
                    maxLength={1000}
                    value={values.emergency_summary}
                    onChange={(e) => set("emergency_summary", e.target.value)}
                    placeholder="e.g. Please call my sister first."
                />
            </Field>

            <Field label="Medical notes (optional)">
                <textarea
                    rows={3}
                    maxLength={1000}
                    value={values.medical_notes}
                    onChange={(e) => set("medical_notes", e.target.value)}
                    placeholder="Only what you are comfortable sharing in an emergency."
                />
            </Field>
        </form>
    );
}