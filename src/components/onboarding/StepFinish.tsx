/**
 * components/onboarding/StepFinish.tsx
 * ---------------------------------------------------------------------------
 * Final slide: a checklist of what was completed or skipped, with an
 * "Add now" shortcut for anything missing, plus the subscription summary.
 *
 * The big buttons ("Subscribe now" / "Save & finish later") are in the
 * footer of pages/Onboarding.tsx.
 */
import type { OnboardingApi } from "../../hooks/useOnboarding";
import type { OnboardingProgress } from "../../lib/onboardingProgress";
import { STEPS, type StepId } from "./onboardingConfig";

type Props = {
    ob: OnboardingApi;
    progress: OnboardingProgress;
    /** Jump back to a slide by its id. */
    onGoTo: (id: StepId) => void;
};

export function StepFinish({ ob, progress, onGoTo }: Props) {
    // Which steps are complete? Data steps are judged by what the backend holds.
    const done: Record<string, boolean> = {
        profile: progress.saved.includes("profile"),
        contacts: ob.contacts.length > 0,
        vehicle: ob.vehicles.length > 0,
        tag: ob.tags.length > 0,
    };

    const checklist = STEPS.filter((s) => s.id in done);

    return (
        <>
            <ul className="ob-list">
                {checklist.map((step) => (
                    <li key={step.id}>
                        <span className="ob-list-icon">{done[step.id] ? "✅" : step.icon}</span>
                        <span>
                            <strong>{step.title}</strong>
                            <small>
                                {done[step.id]
                                    ? "Done"
                                    : progress.skipped.includes(step.id)
                                        ? "Skipped"
                                        : "Not added yet"}
                            </small>
                        </span>
                        {!done[step.id] && (
                            <button
                                type="button"
                                className="ob-link"
                                onClick={() => onGoTo(step.id)}
                            >
                                Add now
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            <div className="ob-plan">
                <div>
                    <small>SafeLink monthly</small>
                    <strong>R19.99 / month</strong>
                </div>
                <div>
                    <small>Trial</small>
                    <strong>7 days (configured)</strong>
                </div>
            </div>

            {ob.activeSub ? (
                <p className="ob-hint">✅ Your subscription is active. You're all set.</p>
            ) : (
                <p className="ob-hint">
                    Subscribing activates emergency access. Not ready? Choose{" "}
                    <strong>Save &amp; finish later</strong>. Everything you added is
                    kept and you can subscribe from your dashboard.
                </p>
            )}
        </>
    );
}