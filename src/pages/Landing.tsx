/**
 * pages/Landing.tsx
 * ---------------------------------------------------------------------------
 * The home page (route: "/"), built like an emergency screen:
 * one fixed screen, no scrolling, two big buttons.
 *
 *   1. SCAN TAG        -> opens the camera (ScanCamera). When a SafeLink QR
 *                         code is read, the person goes to /scan/<token> and
 *                         is asked only for the owner's date of birth.
 *   2. SIGN IN GOOGLE  -> one tap, no password. New users get an account
 *                         automatically. If already signed in, the button
 *                         becomes "Open dashboard".
 *
 * This page does not use <Shell> on purpose: no header or footer means
 * nothing else on screen to distract or to scroll.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { messageOf } from "../utils/messageOf";
import { Alert } from "../components/ui/Alert";
import { ScanCamera } from "../components/scan/ScanCamera";

/** Firebase codes that only mean "the person closed the Google popup". */
const IGNORED_GOOGLE_ERRORS = [
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
];

export function Landing() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false); // camera open?
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setError("");
    setGoogleBusy(true);

    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (!code || !IGNORED_GOOGLE_ERRORS.includes(code)) {
        setError(messageOf(err));
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <main className="emergency-home">
      <div className="emergency-home-inner">
        <div className="brand-mark">S</div>
        <h1>SafeLink</h1>
        <p className="emergency-home-sub">Scan a tag to get emergency help.</p>

        {/* ---------- Button 1: scan the tag ---------- */}
        <button
          type="button"
          className="button primary emergency-button scan-button"
          onClick={() => setScanning(true)}
        >
          <span aria-hidden="true">▦</span> Scan tag
        </button>

        {/* ---------- Button 2: Google sign-in / dashboard ---------- */}
        {user ? (
          <Link
            className="button secondary emergency-button"
            to="/dashboard"
          >
            Open dashboard
          </Link>
        ) : (
          <button
            type="button"
            className="button secondary emergency-button google-button"
            onClick={() => void handleGoogle()}
            disabled={googleBusy}
          >
            <svg
              className="google-icon"
              width="22"
              height="22"
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
            {googleBusy ? "Opening Google…" : "Sign in with Google"}
          </button>
        )}

        {error && <Alert type="error">{error}</Alert>}

        <p className="emergency-home-note">
          SafeLink does not dispatch responders. In immediate danger, contact
          local emergency services.
        </p>
      </div>

      {/* Camera sits on top of the page while scanning */}
      {scanning && <ScanCamera onClose={() => setScanning(false)} />}
    </main>
  );
}