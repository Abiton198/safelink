/**
 * components/tags/TagClaimFlow.tsx
 * ---------------------------------------------------------------------------
 * Claim a SafeLink tag by SCANNING it. No serial numbers, no codes to type.
 *
 *   1. SCAN     The camera reads the QR code on the tag (or a token is passed
 *               in, when the person arrived by scanning with their phone's
 *               own camera: see pages/ClaimTag.tsx).
 *   2. FILL IN  We look the tag up. Its reference and name appear
 *               automatically, together with the account it will be linked to.
 *               Nothing has been changed yet.
 *   3. CONFIRM  The person checks the details and presses "Confirm". Only
 *               then is the tag linked to their account and switched on.
 *
 * Phases: idle -> looking -> preview -> claiming -> done
 *
 * Errors from the server ("already claimed by another account", "not a
 * SafeLink tag", ...) are shown in place and the person can scan again.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth";
import { messageOf } from "../../utils/messageOf";
import {
    confirmTag,
    lookupTag,
    type ClaimPreview,
} from "../../lib/tagClaimApi";
import { ScanCamera } from "../scan/ScanCamera";
import "../../styles/tag-claim.css";

type Phase = "idle" | "looking" | "preview" | "claiming" | "done";

type Props = {
    /** A token already known (the person scanned with their own camera). */
    initialToken?: string;
    /** Called after a tag has been claimed (or is confirmed as already theirs). */
    onClaimed: () => void;
    /** Text of the scan button. */
    scanLabel?: string;
};

export function TagClaimFlow({
    initialToken,
    onClaimed,
    scanLabel = "📷 Scan your tag",
}: Props) {
    const { user } = useAuth();

    const [phase, setPhase] = useState<Phase>(initialToken ? "looking" : "idle");
    const [scanning, setScanning] = useState(false); // camera open?
    const [token, setToken] = useState(initialToken ?? "");
    const [preview, setPreview] = useState<ClaimPreview | null>(null);
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");

    /** Step 2: look the tag up and fill the details in. */
    const findTag = useCallback(
        async (found: string) => {
            if (!user) return;

            setScanning(false);
            setError("");
            setToken(found);
            setPhase("looking");

            try {
                const result = await lookupTag(user, found);
                setPreview(result);
                setLabel(result.label || "SafeLink tag");

                if (result.state === "yours") {
                    setPhase("done"); // already linked to this account
                    onClaimed();
                } else {
                    setPhase("preview");
                }
            } catch (err) {
                setError(messageOf(err));
                setPhase("idle");
            }
        },
        [user, onClaimed]
    );

    // When a token was passed in, look it up once as soon as the user is known.
    const started = useRef(false);
    useEffect(() => {
        if (initialToken && user && !started.current) {
            started.current = true;
            void findTag(initialToken);
        }
    }, [initialToken, user, findTag]);

    /** Step 3: link the tag to the account. */
    async function confirm() {
        if (!user || !preview) return;

        setPhase("claiming");
        setError("");

        try {
            const result = await confirmTag(user, token, label.trim());
            setPreview({ ...preview, state: "yours", label: result.label || label });
            setPhase("done");
            onClaimed();
        } catch (err) {
            setError(messageOf(err));
            setPhase("preview");
        }
    }

    function startOver() {
        setError("");
        setPreview(null);
        setToken("");
        setPhase("idle");
    }

    const owner = user?.displayName || user?.email || "your account";

    return (
        <div className="tc-flow">
            {error && (
                <p className="tc-error" role="alert">
                    {error}
                </p>
            )}

            {/* ---------- 1. Scan ---------- */}
            {phase === "idle" && (
                <>
                    <button
                        type="button"
                        className="tc-btn primary"
                        onClick={() => setScanning(true)}
                    >
                        {scanLabel}
                    </button>
                    <p className="tc-hint">
                        Point your camera at the QR code on the tag. Nothing to type.
                    </p>
                </>
            )}

            {phase === "looking" && <p className="tc-hint">Reading your tag…</p>}

            {/* ---------- 2. Details filled in automatically ---------- */}
            {(phase === "preview" || phase === "claiming") && preview && (
                <div className="tc-card">
                    <h3 className="tc-title">🏷️ Tag found</h3>

                    {preview.tag_ref && (
                        <div className="tc-row">
                            <small>Tag reference</small>
                            <strong>{preview.tag_ref}</strong>
                        </div>
                    )}

                    <div className="tc-row">
                        <small>Will be linked to</small>
                        <strong>{owner}</strong>
                    </div>

                    <label className="tc-row">
                        <small>Tag name (you can change it)</small>
                        <input
                            maxLength={80}
                            value={label}
                            disabled={phase === "claiming"}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </label>

                    {/* ---------- 3. Confirm ---------- */}
                    <button
                        type="button"
                        className="tc-btn primary"
                        disabled={phase === "claiming"}
                        onClick={() => void confirm()}
                    >
                        {phase === "claiming" ? "Claiming…" : "✅ Confirm & claim this tag"}
                    </button>
                    <button
                        type="button"
                        className="tc-btn ghost"
                        disabled={phase === "claiming"}
                        onClick={startOver}
                    >
                        Scan a different tag
                    </button>
                </div>
            )}

            {/* ---------- Done ---------- */}
            {phase === "done" && preview && (
                <>
                    <p className="tc-success">
                        ✅ {preview.label || "Your tag"}
                        {preview.tag_ref ? ` (${preview.tag_ref})` : ""} is claimed and
                        linked to {owner}.
                    </p>
                    <button type="button" className="tc-btn ghost" onClick={startOver}>
                        Claim another tag
                    </button>
                </>
            )}

            {/* Camera sits on top of the page while scanning */}
            {scanning && (
                <ScanCamera
                    onClose={() => setScanning(false)}
                    onToken={(found) => void findTag(found)}
                />
            )}
        </div>
    );
}