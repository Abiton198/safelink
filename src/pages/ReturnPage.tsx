/**
 * pages/ReturnPage.tsx
 * ---------------------------------------------------------------------------
 * Where PayFast sends the customer after the card step.
 *
 *   /subscription/return    -> <ReturnPage />            (card step finished)
 *   /subscription/cancelled -> <ReturnPage cancelled />  (pressed "cancel")
 *
 * IMPORTANT: arriving here is NOT proof of anything; anyone can type this
 * address. The real confirmation is PayFast's server-to-server notification
 * (ITN), which the backend uses to switch the subscription to "trialing".
 *
 * So after a return this page CHECKS WITH THE BACKEND (every few seconds,
 * for about a minute) until the subscription is confirmed. Only then does it:
 *   - show "Your free trial has started"
 *   - mark the onboarding as COMPLETE (so the dashboard banner disappears)
 * If confirmation is slow, it says so and offers "Check again". Nothing is
 * marked complete on a guess.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Shell } from "../components/layout/Shell";
import { useAuth } from "../auth";
import { api } from "../api";
import type { Subscription } from "../types";
import { ACTIVE_STATUSES } from "../components/dashboard/dashboardConfig";
import { loadProgress, saveProgress } from "../lib/onboardingProgress";
import { saveRemoteProgress } from "../lib/onboardingApi";

type ReturnPageProps = {
  /** True when the customer pressed "cancel" at PayFast. */
  cancelled?: boolean;
};

const POLL_EVERY_MS = 3000;
const MAX_TRIES = 20; // about one minute

export function ReturnPage({ cancelled = false }: ReturnPageProps) {
  const { user } = useAuth();

  // confirming -> confirmed | slow
  const [state, setState] = useState<"confirming" | "confirmed" | "slow">(
    "confirming"
  );
  const [attempt, setAttempt] = useState(0); // bump to restart checking
  const stopped = useRef(false);

  /** Records that onboarding is finished (browser + backend). */
  const markOnboardingDone = useCallback(() => {
    if (!user) return;
    const done = { ...loadProgress(user.uid), started: true, done: true };
    saveProgress(user.uid, done);
    void saveRemoteProgress(user, done);
  }, [user]);

  useEffect(() => {
    if (cancelled || !user) return;

    stopped.current = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    setState("confirming");

    async function check() {
      if (stopped.current || !user) return;
      tries += 1;

      try {
        const sub = await api<Subscription>(
          user,
          "/api/v1/subscriptions/me"
        );

        if (ACTIVE_STATUSES.includes(sub.status)) {
          markOnboardingDone();
          setState("confirmed");
          return;
        }
      } catch {
        /* keep trying until we run out of tries */
      }

      if (tries >= MAX_TRIES) {
        setState("slow");
        return;
      }

      timer = setTimeout(() => void check(), POLL_EVERY_MS);
    }

    void check();

    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, [cancelled, user, attempt, markOnboardingDone]);

  /* ---------- Cancelled at PayFast ---------- */
  if (cancelled) {
    return (
      <Shell>
        <main className="simple-page panel">
          <div className="scan-symbol">↩</div>
          <h1>No card added</h1>
          <p className="muted">
            You left PayFast before adding a card, so your free trial has not
            started. Everything you saved is still here.
          </p>
          <Link className="button primary" to={user ? "/onboarding" : "/"}>
            {user ? "Back to setup" : "Back to home"}
          </Link>
        </main>
      </Shell>
    );
  }

  /* ---------- Not signed in ---------- */
  if (!user) {
    return (
      <Shell>
        <main className="simple-page panel">
          <h1>Sign in to continue</h1>
          <p className="muted">
            Sign in to see whether your free trial has started.
          </p>
          <Link className="button primary" to="/auth">
            Sign in
          </Link>
        </main>
      </Shell>
    );
  }

  /* ---------- Confirming / confirmed / slow ---------- */
  return (
    <Shell>
      <main className="simple-page panel">
        {state === "confirming" && (
          <>
            <div className="scan-symbol">⏳</div>
            <h1>Confirming your card…</h1>
            <p className="muted">
              PayFast is confirming your details. This usually takes a few
              seconds. Please keep this page open.
            </p>
          </>
        )}

        {state === "confirmed" && (
          <>
            <div className="scan-symbol">🎉</div>
            <h1>Your free trial has started</h1>
            <p className="muted">
              Your card is saved and nothing was charged today. Your SafeLink
              setup is complete and emergency access is on.
            </p>
            <Link className="button primary" to="/dashboard">
              Go to dashboard
            </Link>
          </>
        )}

        {state === "slow" && (
          <>
            <div className="scan-symbol">🕐</div>
            <h1>Still waiting for PayFast</h1>
            <p className="muted">
              We have not received confirmation yet. This can take a minute. If
              you added your card, it will show up shortly. You have not been
              charged.
            </p>
            <button
              type="button"
              className="button primary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Check again
            </button>
            <Link className="inline-link" to="/dashboard">
              Go to dashboard
            </Link>
          </>
        )}
      </main>
    </Shell>
  );
}