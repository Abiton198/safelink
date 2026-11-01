/**
 * lib/onboardingProgress.ts
 * ---------------------------------------------------------------------------
 * Remembers WHERE the owner stopped in the onboarding wizard, so they can
 * "save and resume later" on the same phone or browser.
 *
 * What is stored (in the browser's localStorage, one entry per user):
 *   step     - the slide they were on
 *   saved    - step ids whose form was saved
 *   skipped  - step ids they chose to skip
 *   started  - they have opened onboarding at least once
 *   done     - they finished (pressed Subscribe, or already subscribed)
 *
 * The information they TYPED (profile, contacts, vehicles, tags) is not kept
 * here. It is saved to backend as soon as they press "Save", so it is
 * already safe and shows up on any device. Only the position is local.
 *
 * Every read/write is wrapped in try/catch because localStorage can be
 * unavailable (private browsing, blocked storage). In that case the wizard
 * still works; it just cannot remember its position.
 */

export type OnboardingProgress = {
    step: number;
    saved: string[];
    skipped: string[];
    started: boolean;
    done: boolean;
};

const EMPTY: OnboardingProgress = {
    step: 0,
    saved: [],
    skipped: [],
    started: false,
    done: false,
};

const storageKey = (uid: string) => `safelink_onboarding_${uid}`;

export function loadProgress(uid: string): OnboardingProgress {
    try {
        const raw = localStorage.getItem(storageKey(uid));
        return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    } catch {
        return { ...EMPTY };
    }
}

export function saveProgress(uid: string, progress: OnboardingProgress) {
    try {
        localStorage.setItem(storageKey(uid), JSON.stringify(progress));
    } catch {
        /* storage unavailable: ignore */
    }
}

export const hasStartedOnboarding = (uid: string) => loadProgress(uid).started;
export const isOnboardingDone = (uid: string) => loadProgress(uid).done;