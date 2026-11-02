/**
 * lib/onboardingApi.ts
 * ---------------------------------------------------------------------------
 * Syncs the wizard position with the backend (/api/v1/onboarding/me) so the
 * owner can resume on ANY device, not just the phone they started on.
 *
 * It is best-effort: if the request fails (offline, backend down) the wizard
 * keeps working from the copy saved in the browser (lib/onboardingProgress).
 * Nothing here grants access to anything; it only remembers the position.
 */
import type { User } from "firebase/auth";
import { api } from "../api";
import type { OnboardingProgress } from "./onboardingProgress";

type RemoteProgress = OnboardingProgress & { exists: boolean };

/** Reads the saved position from the backend, or null if unavailable. */
export async function fetchRemoteProgress(
    user: User
): Promise<OnboardingProgress | null> {
    try {
        const remote = await api<RemoteProgress>(user, "/api/v1/onboarding/me");
        if (!remote?.exists) return null;

        return {
            step: remote.step,
            saved: remote.saved,
            skipped: remote.skipped,
            started: remote.started,
            done: remote.done,
        };
    } catch {
        return null;
    }
}

/** Saves the position to the backend. Failures are ignored on purpose. */
export async function saveRemoteProgress(
    user: User,
    progress: OnboardingProgress
): Promise<void> {
    try {
        await api(user, "/api/v1/onboarding/me", {
            method: "PUT",
            body: JSON.stringify(progress),
        });
    } catch {
        /* offline or backend unavailable: the local copy still works */
    }
}