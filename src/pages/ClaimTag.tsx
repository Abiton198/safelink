/**
 * pages/ClaimTag.tsx
 * ---------------------------------------------------------------------------
 * Route: /claim/:token
 *
 * For someone who scanned an UNCLAIMED tag with their phone's own camera. The
 * public scan page (pages/ScanPage.tsx) offers "This is my tag: claim it",
 * which brings them here with the tag's token already in the address.
 *
 *   - Not signed in -> "Continue with Google". When sign-in finishes, this same
 *     page continues straight into the claim, so nothing is lost.
 *   - Signed in     -> the tag is looked up, its details fill in, and they
 *     press Confirm (components/tags/TagClaimFlow.tsx).
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth";
import { messageOf } from "../utils/messageOf";
import { Shell } from "../components/layout/Shell";
import { Alert } from "../components/ui/Alert";
import { TagClaimFlow } from "../components/tags/TagClaimFlow";

/** Firebase codes that only mean "the person closed the Google popup". */
const IGNORED_GOOGLE_ERRORS = [
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request",
];

export function ClaimTag() {
    const { token = "" } = useParams();
    const { user, signInWithGoogle } = useAuth();

    const [claimed, setClaimed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function handleGoogle() {
        setError("");
        setBusy(true);
        try {
            await signInWithGoogle(); // `user` updates, and this page carries on
        } catch (err) {
            const code = (err as { code?: string })?.code;
            if (!code || !IGNORED_GOOGLE_ERRORS.includes(code)) {
                setError(messageOf(err));
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <Shell>
            <main className="simple-page panel">
                <div className="scan-symbol">🏷️</div>
                <h1>Claim your SafeLink tag</h1>

                {!user ? (
                    <>
                        <p className="muted">
                            Sign in to link this tag to your account. It only takes a tap.
                        </p>
                        <button
                            type="button"
                            className="button primary"
                            onClick={() => void handleGoogle()}
                            disabled={busy}
                        >
                            {busy ? "Opening Google…" : "Continue with Google"}
                        </button>
                        {error && <Alert type="error">{error}</Alert>}
                    </>
                ) : (
                    <>
                        <TagClaimFlow
                            initialToken={token}
                            onClaimed={() => setClaimed(true)}
                        />

                        {claimed && (
                            <Link className="button primary" to="/onboarding">
                                Continue setup →
                            </Link>
                        )}
                    </>
                )}
            </main>
        </Shell>
    );
}