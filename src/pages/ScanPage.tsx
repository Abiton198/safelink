/**
 * pages/ScanPage.tsx
 * ---------------------------------------------------------------------------
 * The PUBLIC page that opens when someone scans a SafeLink QR code
 * (route: "/scan/:token"). No sign-in is needed.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api";
import type { EmergencyData } from "../types";
import { messageOf } from "../utils/messageOf";
import { scanPhotosOf } from "../lib/vehicleImages";
import "../styles/scan.css";
import { Shell } from "../components/layout/Shell";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";

const DEMO_TOKEN = "demo-tag-token-not-active";

type MaskedContact = {
  name: string;
  relationship: string;
  priority: number;
  phone?: string;
  phone_masked?: string;
};

type EmergencyDataWithTrial = Omit<EmergencyData, "emergency_contacts"> & {
  emergency_contacts: MaskedContact[];
  is_trial?: boolean;
  trial_ends_at?: string | null;
  trial_days_remaining?: number;
};

function formatCountdown(targetIso: string, nowMs: number): string {
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return "0d 0h 0m 0s";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/** Converts 8 digits (DDMMYYYY) into YYYY-MM-DD format for backend */
function parseDobToIso(digits: string): string {
  if (digits.length !== 8) return "";
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return `${year}-${month}-${day}`;
}

export function ScanPage() {
  const { token = "" } = useParams();

  // Masked numeric DOB input (DDMMYYYY -> converted to YYYY-MM-DD for backend)
  const [dobDigits, setDobDigits] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [data, setData] = useState<EmergencyDataWithTrial | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Trial countdown gate state
  const [trialNoted, setTrialNoted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Priority message composer state
  const [messageBoxOpen, setMessageBoxOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);

  // Masked passcode state to reveal phone numbers
  const [revealPromptOpen, setRevealPromptOpen] = useState(false);
  const [unlockDobDigits, setUnlockDobDigits] = useState("");
  const [unlockingNumbers, setUnlockingNumbers] = useState(false);
  const [revealError, setRevealError] = useState("");
  const [revealedNumbers, setRevealedNumbers] = useState<Record<string, string>>(
    {}
  );

  const [tagState, setTagState] = useState<
    "checking" | "ready" | "not_activated" | "unknown"
  >("checking");

  useEffect(() => {
    if (!data?.is_trial || !data?.trial_ends_at || trialNoted) return;

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data?.is_trial, data?.trial_ends_at, trialNoted]);

  useEffect(() => {
    let cancelled = false;

    async function checkTag() {
      if (!token || token === DEMO_TOKEN) {
        setTagState("not_activated");
        return;
      }

      setTagState("checking");

      try {
        const result = await api<{ state?: string }>(
          null,
          `/api/v1/public/qr/${encodeURIComponent(token)}/status`
        );

        if (cancelled) return;

        setTagState(result.state === "ready" ? "ready" : "not_activated");
      } catch {
        if (!cancelled) setTagState("unknown");
      }
    }

    void checkTag();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /** Verifies the masked date of birth and loads emergency information. */
  async function verify(e: FormEvent) {
    e.preventDefault();

    if (dobDigits.length !== 8) {
      setError("Please enter a complete 8-digit date of birth (DDMMYYYY).");
      return;
    }

    const isoDob = parseDobToIso(dobDigits);
    setBusy(true);
    setError("");
    setNotice("");
    setData(null);
    setTrialNoted(false);
    setRevealedNumbers({});
    setRevealPromptOpen(false);
    setMessageBoxOpen(false);
    setAlertFeedback(null);

    try {
      const result = await api<{
        access_token: string;
        expires_in_seconds: number;
      }>(null, `/api/v1/public/qr/${encodeURIComponent(token)}/verify`, {
        method: "POST",
        body: JSON.stringify({ date_of_birth: isoDob }),
      });

      setAccessToken(result.access_token);
      setNotice("Verification successful. Loading permitted information…");

      const details = await api<EmergencyDataWithTrial>(
        null,
        `/api/v1/public/emergency?access_token=${encodeURIComponent(
          result.access_token
        )}`
      );

      setNowMs(Date.now());
      setData(details);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  /** Sends an emergency alert message to saved priority contacts without revealing numbers. */
  async function handleSendPriorityAlert(e: FormEvent) {
    e.preventDefault();
    if (!alertMessage.trim() || !accessToken) return;

    setSendingAlert(true);
    setAlertFeedback(null);

    try {
      const res = await api<{ detail?: string; alerted_count?: number }>(
        null,
        "/api/v1/public/emergency/alert-contacts",
        {
          method: "POST",
          body: JSON.stringify({
            access_token: accessToken,
            message: alertMessage.trim(),
          }),
        }
      );

      setAlertFeedback({
        type: "info",
        text:
          res.detail ||
          "Alert triggered and message sent to saved priority contacts.",
      });
      setAlertMessage("");
      setMessageBoxOpen(false);
    } catch (err) {
      setAlertFeedback({
        type: "error",
        text: messageOf(err),
      });
    } finally {
      setSendingAlert(false);
    }
  }

  /** Verifies the masked DOB passcode to unlock and show phone numbers. */
  async function handleRevealNumbers(e: FormEvent) {
    e.preventDefault();
    if (unlockDobDigits.length !== 8) {
      setRevealError("Please enter the complete 8-digit passcode (DDMMYYYY).");
      return;
    }

    setUnlockingNumbers(true);
    setRevealError("");

    try {
      const res = await api<{ numbers: Record<string, string> }>(
        null,
        "/api/v1/public/emergency/reveal-numbers",
        {
          method: "POST",
          body: JSON.stringify({
            access_token: accessToken,
            date_of_birth: parseDobToIso(unlockDobDigits),
          }),
        }
      );

      setRevealedNumbers(res.numbers || {});
      setRevealPromptOpen(false);
      setUnlockDobDigits("");
    } catch (err) {
      setRevealError(messageOf(err));
    } finally {
      setUnlockingNumbers(false);
    }
  }

  function resetAll() {
    setData(null);
    setAccessToken("");
    setDobDigits("");
    setNotice("");
    setError("");
    setTrialNoted(false);
    setMessageBoxOpen(false);
    setAlertMessage("");
    setAlertFeedback(null);
    setRevealPromptOpen(false);
    setUnlockDobDigits("");
    setRevealError("");
    setRevealedNumbers({});
  }

  const showTrialGate = Boolean(
    data?.is_trial && data?.trial_ends_at && !trialNoted
  );
  const numbersUnlocked = Object.keys(revealedNumbers).length > 0;

  return (
    <Shell>
      <main className="scan-wrap">
        <div className="scan-brand">
          <span className="brand-mark">S</span>
          <span>SafeLink</span>
        </div>

        {!data ? (
          /* ================= BEFORE verification ================= */
          <form className="panel scan-panel" onSubmit={verify}>
            <div className="scan-symbol">▦</div>
            <div className="eyebrow">SAFELINK EMERGENCY TAG</div>
            <h1>Verify to continue</h1>

            {tagState === "checking" && (
              <p className="muted">Checking tag status…</p>
            )}

            {tagState === "not_activated" && (
              <Alert type="info">
                This tag has not been activated, or is not available for
                emergency access yet. If you own this tag, sign in to your
                SafeLink dashboard and claim it. If you are assisting someone,
                contact local emergency services if necessary.
              </Alert>
            )}

            {tagState === "not_activated" && token && token !== DEMO_TOKEN && (
              <Link
                className="button secondary full"
                to={`/claim/${encodeURIComponent(token)}`}
              >
                🏷️ This is my tag: claim it
              </Link>
            )}

            <p className="muted">
              A scan alone does not display personal information. Enter the
              owner's date of birth below to request access.
            </p>

            {/* Masked Password-style Date of Birth Input with Format Example */}
            <Field label="Owner's date of birth">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                required
                autoFocus
                placeholder="DDMMYYYY (e.g. 12052010)"
                value={dobDigits}
                onChange={(e) =>
                  setDobDigits(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                style={{
                  width: "100%",
                  letterSpacing: "0.2em",
                  fontFamily: "monospace",
                }}
              />
              <small
                className="muted"
                style={{ display: "block", marginTop: "0.25rem" }}
              >
                Format example: <b>12052010</b> (DDMMYYYY — numbers only,
                hidden on screen)
              </small>
            </Field>

            {error && <Alert type="error">{error}</Alert>}
            {notice && <Alert type="info">{notice}</Alert>}

            <button
              className="button primary full"
              disabled={
                busy ||
                dobDigits.length !== 8 ||
                !token ||
                token === DEMO_TOKEN ||
                tagState === "checking" ||
                tagState === "not_activated"
              }
            >
              {busy ? "Verifying…" : "Verify and view emergency details"}
            </button>

            <p className="fine-print">
              SafeLink does not dispatch responders. If this is an emergency,
              contact local emergency services.
            </p>
          </form>
        ) : showTrialGate && data.trial_ends_at ? (
          /* ================= TRIAL COUNTDOWN NOTICE ================= */
          <div className="panel scan-panel">
            <div className="eyebrow">FREE TRIAL ACTIVE</div>
            <h1>Subscription countdown</h1>

            <p className="muted">
              This SafeLink account is currently operating on a free trial with
              full access. A subscription will be required once the trial period
              ends.
            </p>

            <Alert type="info">
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                  Time remaining until subscription date (
                  {new Date(data.trial_ends_at).toLocaleDateString()}):
                </div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "1.5rem",
                    marginTop: "0.35rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCountdown(data.trial_ends_at, nowMs)}
                </strong>
              </div>
            </Alert>

            <button
              type="button"
              className="button primary full"
              onClick={() => setTrialNoted(true)}
            >
              Noted and continue with full access
            </button>

            <p className="fine-print">
              Are you the owner?{" "}
              <Link className="inline-link" to="/auth">
                Sign in to manage your subscription
              </Link>
              .
            </p>
          </div>
        ) : (
          /* ================= AFTER verification & trial noted ================= */
          <div className="panel emergency-panel">
            <div className="emergency-banner">
              <span>✓</span>
              <div>
                <strong>Verification complete</strong>
                <small>
                  Access expires{" "}
                  {new Date(data.access_expires_at).toLocaleString()}
                </small>
              </div>
            </div>

            <div className="emergency-person">
              <div className="person-avatar">
                {data.profile.display_name?.slice(0, 1).toUpperCase() || "S"}
              </div>
              <div>
                <div className="eyebrow">EMERGENCY PROFILE</div>
                <h1>{data.profile.display_name}</h1>
              </div>
            </div>

            {data.profile.emergency_summary && (
              <section className="emergency-section">
                <h2>Important information</h2>
                <p>{data.profile.emergency_summary}</p>
              </section>
            )}

            {data.profile.medical_notes && (
              <section className="emergency-section medical">
                <h2>Medical notes</h2>
                <p>{data.profile.medical_notes}</p>
              </section>
            )}

            {/* ================= PRIORITY CONTACTS & PASSCODE CONTROLS ================= */}
            <section className="emergency-section">
              <h2>Emergency contacts</h2>

              {data.emergency_contacts.length ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <button
                      type="button"
                      className="button primary full"
                      onClick={() => {
                        setMessageBoxOpen((prev) => !prev);
                        setAlertFeedback(null);
                      }}
                    >
                      ✉️ Send message to priority contacts
                    </button>

                    {!numbersUnlocked && (
                      <button
                        type="button"
                        className="button secondary full"
                        onClick={() => {
                          setRevealPromptOpen((prev) => !prev);
                          setRevealError("");
                        }}
                      >
                        🔒 View phone numbers (requires passcode)
                      </button>
                    )}
                  </div>

                  {alertFeedback && (
                    <Alert type={alertFeedback.type}>{alertFeedback.text}</Alert>
                  )}

                  {/* Message Composer Box */}
                  {messageBoxOpen && (
                    <form
                      onSubmit={handleSendPriorityAlert}
                      style={{
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "10px",
                        padding: "0.9rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Field label="Emergency message to send to saved priority contacts">
                        <textarea
                          rows={3}
                          required
                          maxLength={480}
                          placeholder="Describe the situation, location, and how contacts can reach you…"
                          value={alertMessage}
                          onChange={(e) => setAlertMessage(e.target.value)}
                          style={{ width: "100%", resize: "vertical" }}
                        />
                      </Field>
                      <p className="fine-print" style={{ marginTop: "0.35rem" }}>
                        Phone numbers remain hidden. Clicking send will
                        dispatch an immediate alert to all priority contacts.
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.65rem",
                        }}
                      >
                        <button
                          type="submit"
                          className="button primary"
                          disabled={sendingAlert || !alertMessage.trim()}
                        >
                          {sendingAlert
                            ? "Sending alert…"
                            : "Send & trigger alert"}
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setMessageBoxOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Masked Passcode Box to Reveal Numbers */}
                  {revealPromptOpen && !numbersUnlocked && (
                    <form
                      onSubmit={handleRevealNumbers}
                      style={{
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "10px",
                        padding: "0.9rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Field label="Re-enter owner's date of birth passcode to view numbers">
                        <input
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={8}
                          placeholder="DDMMYYYY (e.g. 12052010)"
                          required
                          value={unlockDobDigits}
                          onChange={(e) =>
                            setUnlockDobDigits(
                              e.target.value.replace(/\D/g, "").slice(0, 8)
                            )
                          }
                          style={{
                            width: "100%",
                            letterSpacing: "0.2em",
                            fontFamily: "monospace",
                          }}
                        />
                        <small
                          className="muted"
                          style={{ display: "block", marginTop: "0.25rem" }}
                        >
                          Format example: <b>12052010</b> (DDMMYYYY — numbers
                          only, hidden on screen)
                        </small>
                      </Field>
                      {revealError && <Alert type="error">{revealError}</Alert>}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.65rem",
                        }}
                      >
                        <button
                          type="submit"
                          className="button primary"
                          disabled={
                            unlockingNumbers || unlockDobDigits.length !== 8
                          }
                        >
                          {unlockingNumbers ? "Checking…" : "Unlock numbers"}
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setRevealPromptOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Contact List */}
                  {data.emergency_contacts.map((contact, index) => {
                    const unlockedPhone =
                      revealedNumbers[String(index)] || contact.phone;

                    return (
                      <div
                        className="emergency-record"
                        key={`${contact.name}-${index}`}
                      >
                        <div>
                          <strong>{contact.name}</strong>
                          <small>
                            {contact.relationship} · Priority {contact.priority}
                          </small>
                          <div
                            style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}
                          >
                            {unlockedPhone ? (
                              <span>{unlockedPhone}</span>
                            ) : (
                              <span className="muted">
                                {contact.phone_masked || "Number hidden"}
                              </span>
                            )}
                          </div>
                        </div>

                        {unlockedPhone ? (
                          <a
                            className="button primary small"
                            href={`tel:${unlockedPhone.replace(/[^+\d]/g, "")}`}
                          >
                            Call {contact.name.split(" ")[0]}
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={() => {
                              setRevealPromptOpen(true);
                              setRevealError("");
                            }}
                          >
                            Unlock to call
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="muted">No contacts have been shared.</p>
              )}
            </section>

            {/* Vehicles and trackers */}
            <section className="emergency-section">
              <h2>Vehicles & trackers</h2>

              {data.vehicles.length ? (
                data.vehicles.map((vehicle, index) => (
                  <div
                    className="vehicle-detail"
                    key={`${vehicle.label}-${index}`}
                  >
                    <strong>{vehicle.label}</strong>
                    <p>
                      {[vehicle.make, vehicle.model, vehicle.colour]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {vehicle.registration_number && (
                      <p>
                        Registration: <b>{vehicle.registration_number}</b>
                      </p>
                    )}

                    {vehicle.tracker_provider && (
                      <p>
                        Tracker: {vehicle.tracker_provider}{" "}
                        {vehicle.tracker_reference}
                      </p>
                    )}

                    {vehicle.notes && <p>{vehicle.notes}</p>}

                    {scanPhotosOf(vehicle).length > 0 && (
                      <div className="scan-photos">
                        {scanPhotosOf(vehicle).map((url, photoIndex) => (
                          <a
                            key={photoIndex}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={url}
                              alt={`${vehicle.label} photo ${photoIndex + 1}`}
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted">No vehicle information has been shared.</p>
              )}
            </section>

            <button
              type="button"
              className="button secondary full"
              onClick={resetAll}
            >
              Close emergency view
            </button>

            <p className="fine-print">
              Are you the owner and want to change these details?{" "}
              <Link className="inline-link" to="/auth">
                Sign in with Google
              </Link>
              .
            </p>

            <p className="fine-print">
              {data.emergency_number_note} This page contains private
              information. Do not take screenshots or share it unnecessarily.
            </p>
          </div>
        )}

        <p className="scan-foot">
          SafeLink · Limited emergency information only
        </p>
      </main>
    </Shell>
  );
}