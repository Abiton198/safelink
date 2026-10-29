/**
 * components/dashboard/OverviewTab.tsx
 * ---------------------------------------------------------------------------
 * The dashboard's landing tab. It shows:
 *   1. Three counters (contacts, vehicles, active tags)
 *   2. A 4-step setup checklist (profile -> contacts -> tag -> subscription)
 *   3. A privacy reminder
 *
 * It only DISPLAYS data. To jump to another tab it calls `onNavigate`,
 * which is provided by Dashboard.tsx.
 */
import type { Contact, Profile, QRTag, Vehicle } from "../../types";
import type { TabId } from "./dashboardConfig";
import { Card } from "../ui/Card";

type OverviewTabProps = {
  profile: Profile;
  contacts: Contact[];
  vehicles: Vehicle[];
  tags: QRTag[];
  /** True when the subscription status allows emergency access. */
  active: boolean;
  /** Switch the dashboard to another tab. */
  onNavigate: (tab: TabId) => void;
};

export function OverviewTab({
  profile,
  contacts,
  vehicles,
  tags,
  active,
  onNavigate,
}: OverviewTabProps) {
  return (
    <>
      {/* ---------- Counters ---------- */}
      <div className="metric-grid">
        <div className="metric-card">
          <span>EMERGENCY CONTACTS</span>
          <strong>{contacts.length}</strong>
          <small>Saved contacts</small>
        </div>

        <div className="metric-card">
          <span>VEHICLES</span>
          <strong>{vehicles.length}</strong>
          <small>Vehicles & trackers</small>
        </div>

        <div className="metric-card">
          <span>QR TAGS</span>
          <strong>{tags.filter((tag) => tag.active).length}</strong>
          <small>Active tags</small>
        </div>
      </div>

      {/* ---------- Setup checklist ---------- */}
      <Card
        title="Your safety setup"
        subtitle="Prepare your details before subscribing."
      >
        <div className="check-list">
          {/* Step 1: profile */}
          <div>
            <span className={profile.display_name ? "check done" : "check"}>
              {profile.display_name ? "✓" : "1"}
            </span>
            <span>
              <strong>Emergency profile</strong>
              <small>Add your name and emergency information.</small>
            </span>
            <button className="inline-link" onClick={() => onNavigate("profile")}>
              Edit profile
            </button>
          </div>

          {/* Step 2: contacts */}
          <div>
            <span className={contacts.length ? "check done" : "check"}>
              {contacts.length ? "✓" : "2"}
            </span>
            <span>
              <strong>Emergency contacts</strong>
              <small>Add at least one trusted contact.</small>
            </span>
            <button className="inline-link" onClick={() => onNavigate("contacts")}>
              Manage
            </button>
          </div>

          {/* Step 3: tag */}
          <div>
            <span className={tags.length ? "check done" : "check"}>
              {tags.length ? "✓" : "3"}
            </span>
            <span>
              <strong>Claim your physical tag</strong>
              <small>
                Use the reference and activation code supplied with your
                purchased tag.
              </small>
            </span>
            <button className="inline-link" onClick={() => onNavigate("tags")}>
              Claim tag
            </button>
          </div>

          {/* Step 4: subscription */}
          <div>
            <span className={active ? "check done" : "check"}>
              {active ? "✓" : "4"}
            </span>
            <span>
              <strong>Subscription</strong>
              <small>
                Subscribe when your profile is ready to activate emergency
                access.
              </small>
            </span>
            <button
              className="inline-link"
              onClick={() => onNavigate("subscription")}
            >
              View
            </button>
          </div>
        </div>
      </Card>

      {/* ---------- Privacy reminder ---------- */}
      <Card
        title="Privacy reminder"
        subtitle="Your QR code does not contain your personal details."
      >
        <p className="body-copy">
          A person who scans your tag must pass the backend's verification
          process before emergency information is released. Date of birth is
          not a strong secret, so only store information that is appropriate
          for emergency disclosure.
        </p>
      </Card>
    </>
  );
}
