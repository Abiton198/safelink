/**
 * components/dashboard/dashboardConfig.ts
 * ---------------------------------------------------------------------------
 * Shared types, constants and "empty form" templates for the owner dashboard.
 *
 * Keeping these in one place means:
 *   - Dashboard.tsx and each tab agree on the same shapes.
 *   - The empty form values are defined once and reused for initial state and
 *     for resetting a form after a successful save.
 */

/* ---------- Tabs ---------- */

/** The ids of the dashboard sections (used for navigation). */
export type TabId =
  | "overview"
  | "profile"
  | "contacts"
  | "vehicles"
  | "tags"
  | "subscription";

/** Items shown in the left-hand dashboard menu: [id, label, icon]. */
export const NAV_ITEMS: ReadonlyArray<readonly [TabId, string, string]> = [
  ["overview", "Overview", "⌂"],
  ["profile", "Emergency profile", "◉"],
  ["contacts", "Contacts", "♡"],
  ["vehicles", "Vehicles & trackers", "◇"],
  ["tags", "QR tags", "▦"],
  ["subscription", "Subscription", "↗"],
];

/** Subscription statuses that count as "emergency access is on". */
export const ACTIVE_STATUSES = ["active", "trialing", "past_due_grace"];

/* ---------- Form shapes ---------- */

/** Fields used when claiming a physical tag. */
export type ClaimForm = {
  tag_ref: string;
  activation_code: string;
  label: string;
};

/**
 * Fields used when adding an emergency contact.
 * `priority` is a string because it comes from a <select>; it is converted
 * to a number just before sending to the API.
 */
export type ContactForm = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  priority: string;
  share_with_responder: boolean;
};

/** Fields used when adding a vehicle / tracker. */
export type VehicleForm = {
  label: string;
  make: string;
  model: string;
  colour: string;
  registration_number: string;
  tracker_provider: string;
  tracker_reference: string;
  notes: string;
};

/* ---------- Blank starting values ---------- */

export const EMPTY_CLAIM_FORM: ClaimForm = {
  tag_ref: "",
  activation_code: "",
  label: "SafeLink tag",
};

export const EMPTY_CONTACT_FORM: ContactForm = {
  name: "",
  relationship: "",
  phone: "",
  email: "",
  priority: "1",
  share_with_responder: true,
};

export const EMPTY_VEHICLE_FORM: VehicleForm = {
  label: "",
  make: "",
  model: "",
  colour: "",
  registration_number: "",
  tracker_provider: "",
  tracker_reference: "",
  notes: "",
};
