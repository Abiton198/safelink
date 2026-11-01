/**
 * pages/Onboarding.tsx
 * ---------------------------------------------------------------------------
 * Guided, step-by-step setup (route: "/onboarding"), shown as a colourful
 * swipe-style carousel that works well on phones.
 *
 *   Welcome -> About you -> Contacts -> Vehicle -> Tag -> Finish
 *
 * Features
 *   - SKIP any optional step, or go BACK to change something.
 *   - Everything is saved to the backend the moment the person presses a
 *     Save / Add button, so nothing is lost if they leave.
 *   - "Save & exit" leaves for the dashboard. The slide they were on is
 *     remembered (lib/onboardingProgress.ts), so they RESUME where they
 *     stopped next time. The dashboard shows a "Continue setup" banner.
 *   - The last slide finishes with the subscription (PayFast checkout), or
 *     "Save & finish later".
 *
 * This page only handles navigation and layout:
 *   data + API calls -> hooks/useOnboarding.ts
 *   the slides       -> components/onboarding/Step*.tsx
 *   the colours      -> styles/onboarding.css
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/onboarding.css";

import { useAuth } from "../auth";
import { useOnboarding } from "../hooks/useOnboarding";
import {
    loadProgress,
    saveProgress,
    type OnboardingProgress,
} from "../lib/onboardingProgress";
import { Alert } from "../components/ui/Alert";
import {
    STEPS,
    type StepId,
} from "../components/onboarding/onboardingConfig";
import { StepWelcome } from "../components/onboarding/StepWelcome";
import { StepProfile } from "../components/onboarding/StepProfile";
import { StepContacts } from "../components/onboarding/StepContacts";
import { StepVehicle } from "../components/onboarding/StepVehicle";
import { StepTag } from "../components/onboarding/StepTag";
import { StepFinish } from "../components/onboarding/StepFinish";

export function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const ob = useOnboarding();

    const uid = user?.uid ?? "";

    // Where the person is. Starts from the saved position (resume!).
    const [progress, setProgress] = useState<OnboardingProgress>(() => {
        const saved = { ...loadProgress(uid), started: true };
        if (uid) saveProgress(uid, saved);
        return saved;
    });

    // Which way the slide should animate in
    const [direction, setDirection] = useState<"forward" | "back">("forward");

    /** Updates progress and remembers it in the browser. */
    function update(patch: Partial<OnboardingProgress>) {
        setProgress((current) => {
            const next = { ...current, ...patch };
            if (uid) saveProgress(uid, next);
            return next;
        });
    }

    const step = Math.min(Math.max(progress.step, 0), STEPS.length - 1);
    const current = STEPS[step];
    const isFirst = step === 0;
    const isFinish = current.id === "finish";

    /* ---------- Navigation ---------- */

    function goTo(index: number) {
        const target = Math.min(Math.max(index, 0), STEPS.length - 1);
        setDirection(target >= step ? "forward" : "back");
        ob.clearMessages();
        update({ step: target });
        window.scrollTo({ top: 0 });
    }

    const goToId = (id: StepId) =>
        goTo(STEPS.findIndex((candidate) => candidate.id === id));

    const next = () => goTo(step + 1);
    const back = () => goTo(step - 1);

    function skip() {
        update({
            skipped: Array.from(new Set([...progress.skipped, current.id])),
        });
        next();
    }

    /** Called by a slide after its form saved successfully. */
    function markSaved(id: StepId) {
        update({ saved: Array.from(new Set([...progress.saved, id])) });
    }

    /** Leave now; the position is already saved. */
    function saveAndExit() {
        navigate("/dashboard");
    }

    /** Last slide: go to PayFast, or straight to the dashboard if subscribed. */
    async function subscribe() {
        if (ob.activeSub) {
            update({ done: true });
            navigate("/dashboard");
            return;
        }

        update({ done: true });
        const started = await ob.beginCheckout();
        if (!started) update({ done: false }); // checkout failed: keep the banner
    }

    /* ---------- Rendering ---------- */

    if (ob.loading) {
        return (
            <div className="ob-screen grad-welcome ob-loading">
                <span className="ob-spinner" aria-hidden="true" />
                <p>Getting your setup ready…</p>
            </div>
        );
    }

    /** Chooses which slide to show. */
    function renderStep() {
        switch (current.id) {
            case "welcome":
                return <StepWelcome />;
            case "profile":
                return (
                    <StepProfile
                        ob={ob}
                        onSaved={() => {
                            markSaved("profile");
                            next();
                        }}
                    />
                );
            case "contacts":
                return <StepContacts ob={ob} />;
            case "vehicle":
                return <StepVehicle ob={ob} />;
            case "tag":
                return <StepTag ob={ob} />;
            case "finish":
                return <StepFinish ob={ob} progress={progress} onGoTo={goToId} />;
        }
    }

    /** Label for the big main button. */
    const primaryLabel = isFinish
        ? ob.activeSub
            ? "Go to dashboard →"
            : "Subscribe now →"
        : current.id === "welcome"
            ? "Let's start →"
            : current.id === "profile"
                ? "Save & continue →"
                : "Continue →";

    return (
        <div className={`ob-screen grad-${current.id}`}>
            {/* ---------- Top bar: exit, progress dots, counter ---------- */}
            <header className="ob-top">
                <button type="button" className="ob-exit" onClick={saveAndExit}>
                    Save &amp; exit
                </button>

                <div className="ob-dots" role="group" aria-label="Setup progress">
                    {STEPS.map((s, index) => (
                        <button
                            key={s.id}
                            type="button"
                            className={
                                index === step ? "ob-dot active" : index < step ? "ob-dot done" : "ob-dot"
                            }
                            aria-label={`Step ${index + 1}: ${s.title}`}
                            aria-current={index === step ? "step" : undefined}
                            onClick={() => goTo(index)}
                        />
                    ))}
                </div>

                <span className="ob-count">
                    {step + 1}/{STEPS.length}
                </span>
            </header>

            {/* ---------- The current slide ---------- */}
            <main className="ob-stage">
                {/* `key` makes React replay the slide-in animation on every step */}
                <section key={current.id} className={`ob-slide ${direction}`}>
                    <div className="ob-slide-head">
                        <span className="ob-emoji" aria-hidden="true">
                            {current.icon}
                        </span>
                        <h1>{current.title}</h1>
                        <p>{current.subtitle}</p>
                    </div>

                    <div className="ob-card">
                        {ob.error && <Alert type="error">{ob.error}</Alert>}
                        {ob.notice && <Alert type="success">{ob.notice}</Alert>}
                        {renderStep()}
                    </div>
                </section>
            </main>

            {/* ---------- Bottom actions (thumb-friendly) ---------- */}
            <footer className="ob-actions">
                {current.id === "profile" ? (
                    // Submits the profile form (matched by its id)
                    <button
                        type="submit"
                        form="ob-profile-form"
                        className="ob-btn primary"
                        disabled={ob.busy}
                    >
                        {ob.busy ? "Saving…" : primaryLabel}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="ob-btn primary"
                        disabled={ob.busy}
                        onClick={isFinish ? () => void subscribe() : next}
                    >
                        {primaryLabel}
                    </button>
                )}

                <div className="ob-actions-row">
                    {!isFirst ? (
                        <button type="button" className="ob-btn ghost" onClick={back}>
                            ← Back
                        </button>
                    ) : (
                        <span />
                    )}

                    {current.skippable ? (
                        <button type="button" className="ob-btn ghost" onClick={skip}>
                            Skip for now
                        </button>
                    ) : isFinish ? (
                        <button type="button" className="ob-btn ghost" onClick={saveAndExit}>
                            Save &amp; finish later
                        </button>
                    ) : (
                        <span />
                    )}
                </div>
            </footer>
        </div>
    );
}