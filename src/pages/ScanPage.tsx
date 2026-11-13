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
import DateOfBirthInput from "../components/onboarding/DateOfBirthInput";

const DEMO_TOKEN = "demo-tag-token-not-active";

/** Optional trial fields returned by the backend on EmergencyData */
type EmergencyDataWithTrial = EmergencyData & {
  is_trial?: boolean;
  trial_ends_at?: string | null;
  trial_days_remaining?: number;
};

/** Helper to format a live countdown string from an ISO target timestamp */
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

export function ScanPage() {
  const { token = "" } = useParams();

  const [dob, setDob] = useState("");
  const [data, setData] = useState<EmergencyDataWithTrial | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Tracks whether the user clicked "Noted & continue with full access"
  // Resets every time the service is used so it always prompts during trial.
  const [trialNoted, setTrialNoted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [tagState, setTagState] = useState<
    "checking" | "ready" | "not_activated" | "unknown"
  >("checking");

  // Live 1-second ticker for the trial countdown
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

  /** Verifies the date of birth and loads the emergency information. */
  async function verify(e: FormEvent) {
    e.preventDefault();

    if (!dob) {
      setError("Please enter a complete, valid date of birth.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    setData(null);
    setTrialNoted(false);

    try {
      const result = await api<{
        access_token: string;
        expires_in_seconds: number;
      }>(null, `/api/v1/public/qr/${encodeURIComponent(token)}/verify`, {
        method: "POST",
        body: JSON.stringify({ date_of_birth: dob }),
      });

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

  const showTrialGate = Boolean(data?.is_trial && data?.trial_ends_at && !trialNoted);

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
              A scan alone does not display personal information. If the tag
              is active, enter the owner's date of birth to request access to
              the limited emergency information they chose to share.
            </p>

            <Field label="Owner's date of birth">
              <DateOfBirthInput
                required
                autoFocus
                value={dob}
                onChange={setDob}
              />
            </Field>

            {error && <Alert type="error">{error}</Alert>}
            {notice && <Alert type="info">{notice}</Alert>}

            <button
              className="button primary full"
              disabled={
                busy ||
                !dob ||
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

            <section className="emergency-section">
              <h2>Emergency contacts</h2>

              {data.emergency_contacts.length ? (
                data.emergency_contacts.map((contact, index) => (
                  <div
                    className="emergency-record"
                    key={`${contact.phone}-${index}`}
                  >
                    <div>
                      <strong>{contact.name}</strong>
                      <small>
                        {contact.relationship} · Priority {contact.priority}
                      </small>
                    </div>

                    <a
                      className="button primary small"
                      href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                    >
                      Call {contact.name.split(" ")[0]}
                    </a>
                  </div>
                ))
              ) : (
                <p className="muted">No contacts have been shared.</p>
              )}
            </section>

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
              onClick={() => {
                setData(null);
                setDob("");
                setNotice("");
                setError("");
                setTrialNoted(false);
              }}
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