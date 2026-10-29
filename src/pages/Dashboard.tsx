/**
 * pages/Dashboard.tsx
 * ---------------------------------------------------------------------------
 * The signed-in owner's dashboard (route: "/dashboard").
 *
 * This file is the "brain" of the dashboard. It:
 *   - holds all the state (profile, contacts, vehicles, tags, subscription)
 *   - loads that data from the API
 *   - contains every action (save profile, claim tag, add/delete, checkout...)
 *   - decides which tab to show
 *
 * The visual parts of each tab live in components/dashboard/*Tab.tsx. They
 * receive data and callbacks from here as props, so they stay simple.
 */
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../auth";
import { api, apiBaseUrl } from "../api";
import type {
  Contact,
  Profile,
  QRTag,
  Subscription,
  Vehicle,
} from "../types";

import { messageOf } from "../utils/messageOf";
import { Shell } from "../components/layout/Shell";
import { Alert } from "../components/ui/Alert";

import {
  ACTIVE_STATUSES,
  EMPTY_CLAIM_FORM,
  EMPTY_CONTACT_FORM,
  EMPTY_VEHICLE_FORM,
  NAV_ITEMS,
  type ClaimForm,
  type ContactForm,
  type TabId,
  type VehicleForm,
} from "../components/dashboard/dashboardConfig";
import { OverviewTab } from "../components/dashboard/OverviewTab";
import { ProfileTab } from "../components/dashboard/ProfileTab";
import { ContactsTab } from "../components/dashboard/ContactsTab";
import { VehiclesTab } from "../components/dashboard/VehiclesTab";
import { TagsTab } from "../components/dashboard/TagsTab";
import { SubscriptionTab } from "../components/dashboard/SubscriptionTab";

export function Dashboard() {
  const { user, sendVerification } = useAuth();

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */

  // Which tab is open
  const [tab, setTab] = useState<TabId>("overview");

  // Data loaded from the API
  const [sub, setSub] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile>({
    display_name: user?.displayName || "",
    date_of_birth: "",
    emergency_summary: "",
    medical_notes: "",
    preferred_language: "en",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tags, setTags] = useState<QRTag[]>([]);

  // General UI state
  const [loading, setLoading] = useState(true); // first load of the dashboard
  const [busy, setBusy] = useState(false); // a form is being submitted
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Form state (each form is reset to its "empty" template after saving)
  const [claimForm, setClaimForm] = useState<ClaimForm>(EMPTY_CLAIM_FORM);
  const [contactForm, setContactForm] =
    useState<ContactForm>(EMPTY_CONTACT_FORM);
  const [vehicleForm, setVehicleForm] =
    useState<VehicleForm>(EMPTY_VEHICLE_FORM);
  const [cancelReason, setCancelReason] = useState("");

  /* ------------------------------------------------------------------ */
  /* Loading data                                                       */
  /* ------------------------------------------------------------------ */

  /** Fetches everything the dashboard needs, in parallel. */
  async function loadAll() {
    if (!user) return;

    setLoading(true);
    setError("");

    /*
     * Important: load the owner's information independently of subscription
     * status. A missing/inactive subscription must not prevent profile setup.
     *
     * Promise.allSettled lets each request succeed or fail on its own, so one
     * failing call does not hide the data from the others.
     *
     * The backend must also permit these owner endpoints without a subscription.
     */
    const results = await Promise.allSettled([
      api<Subscription>(user, "/api/v1/subscriptions/me"),
      api<Profile>(user, "/api/v1/profile/me"),
      api<{ contacts: Contact[] }>(user, "/api/v1/profile/me/contacts"),
      api<{ vehicles: Vehicle[] }>(user, "/api/v1/profile/me/vehicles"),
      api<{ qr_tags: QRTag[] }>(user, "/api/v1/qr-tags"),
    ]);

    const [
      subscriptionResult,
      profileResult,
      contactsResult,
      vehiclesResult,
      tagsResult,
    ] = results;

    // Subscription: if it fails, treat the user as "not subscribed yet".
    if (subscriptionResult.status === "fulfilled") {
      setSub(subscriptionResult.value);
    } else {
      setSub(null);
    }

    if (profileResult.status === "fulfilled") {
      setProfile({
        ...profileResult.value,
        // DOB is deliberately not returned by the profile read endpoint.
        // The owner re-enters it when saving a profile update.
        date_of_birth: "",
      });
    }

    if (contactsResult.status === "fulfilled") {
      setContacts(contactsResult.value.contacts || []);
    }

    if (vehiclesResult.status === "fulfilled") {
      setVehicles(vehiclesResult.value.vehicles || []);
    }

    if (tagsResult.status === "fulfilled") {
      setTags(tagsResult.value.qr_tags || []);
    }

    /*
     * Surface owner-data errors, but do not treat an unavailable subscription
     * record as a reason to lock the dashboard.
     */
    const ownerErrors = [
      profileResult,
      contactsResult,
      vehiclesResult,
      tagsResult,
    ].filter((result) => result.status === "rejected");

    if (ownerErrors.length) {
      const firstError = ownerErrors[0];
      if (firstError.status === "rejected") {
        setError(messageOf(firstError.reason));
      }
    }

    setLoading(false);
  }

  // Load once when the signed-in user is known/changes.
  useEffect(() => {
    void loadAll();
    // loadAll is intentionally invoked when the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ------------------------------------------------------------------ */
  /* Actions: profile                                                   */
  /* ------------------------------------------------------------------ */

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (!profile.date_of_birth) {
        throw new Error(
          "Enter your date of birth to save or update your profile."
        );
      }

      // Send only the fields the API expects
      const payload = {
        display_name: profile.display_name,
        date_of_birth: profile.date_of_birth,
        emergency_summary: profile.emergency_summary,
        medical_notes: profile.medical_notes,
        preferred_language: profile.preferred_language,
      };

      await api(user, "/api/v1/profile/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setNotice(
        "Emergency profile saved. Your date of birth is not returned by the profile read endpoint."
      );

      // Clear DOB from the form again so it is never left sitting in state.
      setProfile((current) => ({ ...current, date_of_birth: "" }));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Actions: QR tags                                                   */
  /* ------------------------------------------------------------------ */

  async function claimTag(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await api<{
        message?: string;
        tag_ref?: string;
        status?: string;
      }>(user, "/api/v1/qr-tags/claim", {
        method: "POST",
        body: JSON.stringify({
          tag_ref: claimForm.tag_ref.trim(),
          activation_code: claimForm.activation_code.trim(),
          label: claimForm.label.trim() || "SafeLink tag",
        }),
      });

      setClaimForm(EMPTY_CLAIM_FORM);

      setNotice(
        result.message ||
        "Your tag has been claimed. You can now finish setting up your profile."
      );

      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function deactivateTag(id: string) {
    if (
      !user ||
      !confirm(
        "Deactivate this QR tag? It will no longer grant emergency access."
      )
    ) {
      return;
    }

    setError("");

    try {
      await api(user, `/api/v1/qr-tags/${id}/deactivate`, { method: "POST" });

      setNotice("Tag deactivation requested.");
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Actions: contacts                                                  */
  /* ------------------------------------------------------------------ */

  async function addContact(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api(user, "/api/v1/profile/me/contacts", {
        method: "POST",
        body: JSON.stringify({
          ...contactForm,
          email: contactForm.email || null, // empty email -> null
          priority: Number(contactForm.priority), // "1" -> 1
        }),
      });

      setContactForm(EMPTY_CONTACT_FORM);
      setNotice("Emergency contact added.");
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteContact(id: string) {
    if (!user || !confirm("Delete this emergency contact?")) return;

    setError("");

    try {
      await api(user, `/api/v1/profile/me/contacts/${id}`, {
        method: "DELETE",
      });
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Actions: vehicles                                                  */
  /* ------------------------------------------------------------------ */

  async function addVehicle(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api(user, "/api/v1/profile/me/vehicles", {
        method: "POST",
        body: JSON.stringify(vehicleForm),
      });

      setVehicleForm(EMPTY_VEHICLE_FORM);
      setNotice("Vehicle details added.");
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteVehicle(id: string) {
    if (!user || !confirm("Delete this vehicle?")) return;

    setError("");

    try {
      await api(user, `/api/v1/profile/me/vehicles/${id}`, {
        method: "DELETE",
      });
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Actions: subscription / payment                                    */
  /* ------------------------------------------------------------------ */

  /** Asks the backend for PayFast fields, then posts them to PayFast. */
  async function beginCheckout() {
    if (!user) return;

    setError("");
    setNotice("");

    try {
      // Refresh the user so `emailVerified` is up to date.
      await user.reload();

      if (!user.emailVerified) {
        setError(
          "Please verify your email before starting checkout. Use the verification link sent when you registered."
        );
        return;
      }

      const result = await api<{
        process_url: string;
        fields: Record<string, string>;
      }>(user, "/api/v1/payments/payfast/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan_id: "safelink_monthly",
          accepted_recurring_terms: true,
          terms_version: "safelink-recurring-v1",
        }),
      });

      // Submit the server-generated PayFast fields, not browser-calculated prices.
      // We build a hidden form and submit it so the browser navigates to PayFast.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.process_url;

      for (const [key, value] of Object.entries(result.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function requestCancellation() {
    if (!user) return;

    setError("");
    setNotice("");

    try {
      const result = await api<{ message: string }>(
        user,
        "/api/v1/subscriptions/cancel",
        {
          method: "POST",
          body: JSON.stringify({ reason: cancelReason || null }),
        }
      );

      setNotice(result.message);
      setCancelReason("");
      await loadAll();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */
  /* ------------------------------------------------------------------ */

  // First load: show a simple loading card inside the normal page frame.
  if (loading) {
    return (
      <Shell>
        <main className="dashboard-wrap">
          <div className="loading-card">Loading your SafeLink dashboard…</div>
        </main>
      </Shell>
    );
  }

  // Does the subscription status allow emergency access?
  const active = !!sub && ACTIVE_STATUSES.includes(sub.status);

  return (
    <Shell>
      <main className="dashboard-wrap">
        {/* ---------- Welcome header + status pill ---------- */}
        <div className="dash-welcome">
          <div>
            <div className="eyebrow">OWNER DASHBOARD</div>
            <h1>
              Hello,{" "}
              {user?.displayName || user?.email?.split("@")[0] || "there"}.
            </h1>
            <p>
              Manage your emergency details and SafeLink tags from one place.
            </p>
          </div>

          <div className={`status-pill ${active ? "good" : "waiting"}`}>
            <span />
            {sub?.status || "subscription not started"}
          </div>
        </div>

        {/* ---------- Messages ---------- */}
        {error && <Alert type="error">{error}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}

        {!user?.emailVerified && (
          <Alert type="info">
            Your email is not verified. You can prepare your profile, but
            verify your email before checkout.{" "}
            <button
              className="inline-link"
              onClick={() =>
                void sendVerification()
                  .then(() => setNotice("Verification email sent."))
                  .catch((err) => setError(messageOf(err)))
              }
            >
              Send verification email
            </button>
          </Alert>
        )}

        <div className="dash-grid">
          {/* ---------- Left menu ---------- */}
          <aside className="dash-nav panel">
            {NAV_ITEMS.map(([id, label, icon]) => (
              <button
                key={id}
                className={tab === id ? "nav-item selected" : "nav-item"}
                onClick={() => setTab(id)}
              >
                <span>{icon}</span>
                {label}
                {tab === id && <b>›</b>}
              </button>
            ))}

            <div className="nav-help">
              <strong>Need help?</strong>
              <p>Keep emergency contacts and vehicle details up to date.</p>
            </div>
          </aside>

          {/* ---------- Active tab ---------- */}
          <div className="dash-content">
            {tab === "overview" && (
              <OverviewTab
                profile={profile}
                contacts={contacts}
                vehicles={vehicles}
                tags={tags}
                active={active}
                onNavigate={setTab}
              />
            )}

            {tab === "profile" && (
              <ProfileTab
                profile={profile}
                setProfile={setProfile}
                busy={busy}
                onSubmit={saveProfile}
              />
            )}

            {tab === "contacts" && (
              <ContactsTab
                contacts={contacts}
                form={contactForm}
                setForm={setContactForm}
                busy={busy}
                onAdd={addContact}
                onDelete={(id) => void deleteContact(id)}
              />
            )}

            {tab === "vehicles" && (
              <VehiclesTab
                vehicles={vehicles}
                form={vehicleForm}
                setForm={setVehicleForm}
                busy={busy}
                onAdd={addVehicle}
                onDelete={(id) => void deleteVehicle(id)}
              />
            )}

            {tab === "tags" && (
              <TagsTab
                tags={tags}
                claimForm={claimForm}
                setClaimForm={setClaimForm}
                busy={busy}
                onClaim={claimTag}
                onDeactivate={(id) => void deactivateTag(id)}
              />
            )}

            {tab === "subscription" && (
              <SubscriptionTab
                sub={sub}
                active={active}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                onCheckout={() => void beginCheckout()}
                onCancel={() => void requestCancellation()}
                onRefresh={() => void loadAll()}
              />
            )}
          </div>
        </div>

        {/* Shows which backend this build talks to (useful when debugging) */}
        <div className="api-note">
          Connected API: <code>{apiBaseUrl()}</code>
        </div>
      </main>
    </Shell>
  );
}
