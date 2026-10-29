/**
 * pages/ScanPage.tsx
 * ---------------------------------------------------------------------------
 * The PUBLIC page that opens when someone scans a SafeLink QR code
 * (route: "/scan/:token"). No sign-in is needed.
 *
 * Flow:
 *   1. On load, ask the backend if the tag is activated (status only, no
 *      personal data).
 *   2. The person scanning enters the owner's date of birth.
 *   3. The backend verifies it and returns a short-lived access token.
 *   4. We use that token to fetch ONLY the information the owner chose to share
 *      and display it.
 *
 * A scan alone reveals nothing personal.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";

import { api } from "../api";
import type { EmergencyData } from "../types";
import { messageOf } from "../utils/messageOf";
import { Shell } from "../components/layout/Shell";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";

/** The placeholder token used by the demo QR on the landing page. */
const DEMO_TOKEN = "demo-tag-token-not-active";

export function ScanPage() {
  // The token comes from the address: /scan/<token>
  const { token = "" } = useParams();

  const [dob, setDob] = useState("");
  const [data, setData] = useState<EmergencyData | null>(null); // set after verification
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /**
   * What we know about the tag:
   *   checking      - status request is running
   *   ready         - tag is activated, verification can proceed
   *   not_activated - tag is not claimed/active (or is the demo tag)
   *   unknown       - status lookup failed; let the verify call decide
   */
  const [tagState, setTagState] = useState<
    "checking" | "ready" | "not_activated" | "unknown"
  >("checking");

  /*
   * This status endpoint must return status only—never personal information.
   * The DOB verification endpoint remains the authority for access.
   */
  useEffect(() => {
    // `cancelled` stops us updating state if the user leaves the page
    // before the request finishes.
    let cancelled = false;

    async function checkTag() {
      if (!token || token === DEMO_TOKEN) {
        setTagState("not_activated");
        return;
      }

      setTagState("checking");

      try {
        const result = await api<{ state?: string }>(
          null, // public endpoint: no signed-in user
          `/api/v1/public/qr/${encodeURIComponent(token)}/status`
        );

        if (cancelled) return;

        setTagState(result.state === "ready" ? "ready" : "not_activated");
      } catch {
        // If status lookup is unavailable, still allow the verify request
        // to give the backend's authoritative response.
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

    setBusy(true);
    setError("");
    setNotice("");
    setData(null);

    try {
      // Step 1: exchange the date of birth for a short-lived access token
      const result = await api<{
        access_token: string;
        expires_in_seconds: number;
      }>(null, `/api/v1/public/qr/${encodeURIComponent(token)}/verify`, {
        method: "POST",
        body: JSON.stringify({ date_of_birth: dob }),
      });

      setNotice("Verification successful. Loading permitted information…");

      // Step 2: use that token to fetch the information the owner shares
      const details = await api<EmergencyData>(
        null,
        `/api/v1/public/emergency?access_token=${encodeURIComponent(
          result.access_token
        )}`
      );

      setData(details);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

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

            <p className="muted">
              A scan alone does not display personal information. If the tag
              is active, enter the owner's date of birth to request access to
              the limited emergency information they chose to share.
            </p>

            <Field label="Owner's date of birth">
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </Field>

            {error && <Alert type="error">{error}</Alert>}
            {notice && <Alert type="info">{notice}</Alert>}

            {/* Disabled while busy, for the demo tag, or when the tag is not usable */}
            <button
              className="button primary full"
              disabled={
                busy ||
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
        ) : (
          /* ================= AFTER verification ================= */
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

            {/* Owner's name with an initial avatar */}
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

            {/* Contacts: each has a tap-to-call button */}
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

                    {/* Strip everything except digits and "+" so tel: links work */}
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
                  </div>
                ))
              ) : (
                <p className="muted">No vehicle information has been shared.</p>
              )}
            </section>

            {/* Closing wipes the private data from the screen */}
            <button
              className="button secondary full"
              onClick={() => {
                setData(null);
                setDob("");
                setNotice("");
                setError("");
              }}
            >
              Close emergency view
            </button>

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
