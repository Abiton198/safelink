/**
 * pages/AuthPage.tsx
 * ---------------------------------------------------------------------------
 * Combined "Create account" / "Sign in" page (route: "/auth").
 *
 * Two ways to get in:
 *   1. EASY OPTION: "Continue with Google" - one click, no password and no
 *      email verification step (Google has already verified the address).
 *      The same button works for both new and returning users.
 *   2. Email + password - the original form, kept below the Google button.
 *
 * Behaviour:
 *   - Two tabs switch the email form between sign-up and sign-in mode.
 *   - On email sign-up we create the account and show a "check your email"
 *     notice (with a button to resend the verification email).
 *   - On email sign-in we go straight to the dashboard.
 *   - If the user is already signed in (e.g. just finished Google sign-in),
 *     the useEffect below redirects them to the dashboard.
 *
 * Requires `signInWithGoogle` from useAuth() - see the snippet for auth.tsx.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { messageOf } from "../utils/messageOf";
import { Shell } from "../components/layout/Shell";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";

/**
 * Firebase error codes that just mean "the person closed the Google popup".
 * That is not a real error, so we do not show a red message for it.
 */
const IGNORED_GOOGLE_ERRORS = [
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
];

export function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle, sendVerification } =
    useAuth();
  const navigate = useNavigate();

  // Which tab is showing
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [busy, setBusy] = useState(false); // true while an email request is running
  const [googleBusy, setGoogleBusy] = useState(false); // true while Google popup is open
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Once a user exists (signed in or just registered), leave this page.
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  /** Handles the email form submit for both sign-up and sign-in. */
  async function submit(e: FormEvent) {
    e.preventDefault(); // stop the browser doing a full page reload
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (mode === "signup") {
        await signUp(name, email, password);
        setNotice(
          "Account created. Check your email for a verification link. You can prepare your profile before subscribing."
        );
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Google sign-in. Opens the Google account picker; when the person picks an
   * account, `user` is set and the useEffect above sends them to the dashboard.
   * New users get an account created automatically.
   */
  async function handleGoogle() {
    setError("");
    setNotice("");
    setGoogleBusy(true);

    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // Closing the popup is not an error worth showing.
      if (!code || !IGNORED_GOOGLE_ERRORS.includes(code)) {
        setError(messageOf(err));
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <Shell>
      <main className="auth-layout">
        {/* ---------- Left: intro text ---------- */}
        <div className="auth-intro">
          <div className="eyebrow">YOUR SAFETY PROFILE</div>
          <h1>
            Be prepared
            <br />
            <em>for the unexpected.</em>
          </h1>
          <p>
            Claim your tag, set up your emergency profile, and subscribe when
            you are ready to activate emergency access.
          </p>

          <div className="auth-benefit">
            ◈ <span>One profile for your contacts, vehicle and tag</span>
          </div>
          <div className="auth-benefit">
            ◈ <span>Set up your profile before payment</span>
          </div>
        </div>

        {/* ---------- Right: sign-in options ---------- */}
        <form className="panel auth-panel" onSubmit={submit}>
          <h2>{mode === "signup" ? "Start with SafeLink" : "Welcome back"}</h2>
          <p className="muted">
            {mode === "signup"
              ? "Create your owner account."
              : "Sign in to manage your information."}
          </p>

          {/* ===== EASY OPTION: Google ===== */}
          <button
            type="button"
            className="button secondary full google-button"
            onClick={() => void handleGoogle()}
            disabled={googleBusy || busy}
          >
            {/* Official multi-colour Google "G" */}
            <svg
              className="google-icon"
              width="18"
              height="18"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            {googleBusy ? "Opening Google…" : "Continue with Google"}
          </button>

          <p className="fine-print">
            No password needed. Works for new and returning users.
          </p>

          {/* ===== Divider ===== */}
          <div className="auth-divider">
            <span>or use your email</span>
          </div>

          {/* ===== Email + password option ===== */}
          <div className="tabs">
            <button
              type="button"
              className={mode === "signup" ? "tab active" : "tab"}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>

            <button
              type="button"
              className={mode === "signin" ? "tab active" : "tab"}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
          </div>

          {/* Name is only needed when creating an account */}
          {mode === "signup" && (
            <Field label="Full name">
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
          )}

          <Field label="Email address">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </Field>

          {error && <Alert type="error">{error}</Alert>}

          {notice && (
            <Alert type="success">
              {notice}
              <button
                type="button"
                className="inline-link"
                onClick={() =>
                  void sendVerification()
                    .then(() =>
                      setNotice(
                        "Verification email sent again. Check your inbox."
                      )
                    )
                    .catch((err) => setError(messageOf(err)))
                }
              >
                Resend verification email
              </button>
            </Alert>
          )}

          <button
            className="button primary full"
            disabled={busy || googleBusy}
          >
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account →"
                : "Sign in →"}
          </button>

          <p className="fine-print">
            Only add emergency information you are comfortable sharing with a
            verified responder. Keep your details up to date.
          </p>
        </form>
      </main>
    </Shell>
  );
}