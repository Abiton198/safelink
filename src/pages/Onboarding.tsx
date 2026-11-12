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
 *   - Details typed into a form but not yet added are SAVED when the person
 *     presses Continue / Back / Save & exit (see FlushPending), never lost.
 *   - Everything is saved to the backend the moment the person presses a
 *     Save / Add button, so nothing is lost if they leave.
 *   - "Save & exit" leaves for the dashboard. The slide they were on is
 *     remembered (lib/onboardingProgress.ts), so they RESUME where they
 *     stopped next time. The dashboard shows a "Continue setup" banner.
 *   - The last slide finishes by adding a card (PayFast, R0.00 today) to
 *     start the free trial, or "Save & finish later". Onboarding counts as
 *     COMPLETE only once the backend confirms the card.
 *
 * This page only handles navigation and layout:
 *   data + API calls -> hooks/useOnboarding.ts
 *   the slides       -> components/onboarding/Step*.tsx
 *   the colours      -> styles/onboarding.css
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/onboarding.css";

import { useAuth } from "../auth";
import { useOnboarding } from "../hooks/useOnboarding";
import {
    loadProgress,
    saveProgress,
    type OnboardingProgress,
} from "../lib/onboardingProgress";
import { fetchRemoteProgress, saveRemoteProgress } from "../lib/onboardingApi";
import { Alert } from "../components/ui/Alert";
import {
    STEPS,
    type FlushPending,
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

    /* ---------- Sync with the backend (resume on any device) ---------- */

    // Has the saved backend copy been checked yet?
    const [hydrated, setHydrated] = useState(false);

    // 1) Once, after the first load: if this device is "fresh" (nothing saved
    //    locally) but the backend has progress, continue from the backend's.
    useEffect(() => {
        if (ob.loading || hydrated || !user) return;

        let cancelled = false;

        void fetchRemoteProgress(user).then((remote) => {
            if (cancelled) return;

            if (remote) {
                setProgress((local) => {
                    const freshDevice =
                        local.step === 0 &&
                        local.saved.length === 0 &&
                        local.skipped.length === 0;

                    if (!freshDevice) return local; // this device already has progress

                    const merged = { ...remote, started: true };
                    if (uid) saveProgress(uid, merged);
                    return merged;
                });
            }

            setHydrated(true);
        });

        return () => {
            cancelled = true;
        };
    }, [ob.loading, hydrated, user, uid]);

    // 2) Whenever progress changes, save it to the backend (after a short
    //    pause so quick taps are sent as one request).
    useEffect(() => {
        if (!user || !hydrated) return;

        const timer = setTimeout(() => {
            void saveRemoteProgress(user, progress);
        }, 500);

        return () => clearTimeout(timer);
    }, [progress, user, hydrated]);

    // If the backend already shows a trial or active subscription (for example
    // the person closed the tab right after PayFast), onboarding is complete.
    useEffect(() => {
        if (!ob.loading && ob.activeSub && !progress.done) update({ done: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ob.loading, ob.activeSub, progress.done]);

    const step = Math.min(Math.max(progress.step, 0), STEPS.length - 1);
    const current = STEPS[step];
    const isFirst = step === 0;
    const isFinish = current.id === "finish";

    /* ---------- Navigation ---------- */

    /**
     * The slide on screen can register a function that saves anything typed but
     * not yet added (see FlushPending). Leaving the slide always runs it first.
     */
    const flushRef = useRef<FlushPending | null>(null);

    async function flushPending(): Promise<boolean> {
        const flush = flushRef.current;
        return flush ? await flush() : true;
    }

    async function goTo(index: number) {
        // Stay on this slide if typed details could not be saved.
        if (!(await flushPending())) return;

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
        // "Skip" means leave this slide as it is: typed-but-unsaved details are dropped.
        flushRef.current = null;
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
    async function saveAndExit() {
        if (!(await flushPending())) return;
        navigate("/dashboard");
    }

    /**
     * Last slide ONLY: this is the one place PayFast is opened.
     * Every earlier slide just saves or skips.
     *
     * Onboarding is NOT marked complete here. It completes only when the
     * backend confirms the card (the ITN starts the trial). The return page
     * (pages/ReturnPage.tsx) checks that and then marks it done.
     *
     * If the person already has a trial or subscription, no gateway is needed.
     */
    async function subscribe() {
        if (ob.activeSub) {
            update({ done: true });
            navigate("/dashboard");
            return;
        }

        await ob.beginCheckout(); // opens PayFast; shows an error here if it can't
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
                return <StepContacts ob={ob} registerFlush={(f) => { flushRef.current = f; }} />;
            case "vehicle":
                return <StepVehicle ob={ob} registerFlush={(f) => { flushRef.current = f; }} />;
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
            : "Add card & start free trial →"
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