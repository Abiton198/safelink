/**
 * SafeLink frontend data contracts.
 *
 * These types describe the expected API responses.
 * They do not enforce security: the backend remains responsible for
 * authentication, ownership, tag activation, and subscription checks.
 */

export type Profile = {
  owner_uid?: string;
  display_name: string;

  /**
   * The API should not return the stored DOB digest or raw DOB on profile reads.
   * This field is used by the frontend when collecting a DOB for saving.
   */
  date_of_birth?: string;

  emergency_summary: string;
  medical_notes: string;
  preferred_language: string;

  updated_at?: unknown;
  created_at?: unknown;
};

export type Contact = {
  contact_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  priority: number;
  share_with_responder: boolean;
};

export type Vehicle = {
  vehicle_id: string;
  label: string;
  make: string;
  model: string;
  colour: string;
  registration_number: string;
  tracker_provider: string;
  tracker_reference: string;
  notes: string;
};

/**
 * Customer-owned QR tag.
 *
 * This is separate from an unclaimed inventory tag.
 * Customers should claim physical tags rather than generate stock tags
 * directly from the owner dashboard.
 */
export type QRTag = {
  qr_id: string;
  label: string;
  active: boolean;

  /**
   * Optional public reference printed on the physical tag.
   * The backend must confirm the actual field name it returns.
   */
  tag_ref?: string;

  /**
   * The backend should return a scan URL only if the product design
   * explicitly requires it. Do not expose activation codes or token hashes.
   */
  scan_url?: string;

  status?: "available" | "sold" | "activated" | "deactivated" | string;

  created_at?: unknown;
  last_verified_at?: unknown;
};

/**
 * Subscription status returned by the backend.
 *
 * The frontend must not use this value as the final authority for
 * releasing emergency information.
 */
export type Subscription = {
  status: string;

  subscription?: {
    plan_id?: string;
    current_period_end?: string | null;
    trial_end?: string | null;
    cancel_at_period_end?: boolean;
    [key: string]: unknown;
  } | null;

  current_period_end?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
};

/**
 * Result of claiming a physical SafeLink tag.
 */
export type QRTagClaimResult = {
  message?: string;
  qr_id?: string;
  tag_ref?: string;
  label?: string;
  status?: string;
};

/**
 * Public QR status response.
 *
 * This response must not contain an owner's personal or emergency data.
 */
export type QRPublicStatus = {
  state: "ready" | "not_activated" | "deactivated" | string;
  message?: string;
};

/**
 * Response returned by DOB verification.
 *
 * The access token should be short-lived and validated by the backend
 * on every request for protected emergency information.
 */
export type EmergencyAccessToken = {
  access_token: string;
  expires_in_seconds: number;
};

/**
 * Information returned to a verified emergency responder.
 *
 * Only include fields the backend explicitly permits for emergency access.
 */
export type EmergencyData = {
  profile: {
    display_name: string;
    emergency_summary: string;
    medical_notes: string;
    preferred_language: string;
  };

  emergency_contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    priority: number;
  }>;

  vehicles: Array<{
    label: string;
    make: string;
    model: string;
    colour: string;
    registration_number: string;
    tracker_provider: string;
    tracker_reference: string;
    notes: string;
  }>;

  access_expires_at: string;
  emergency_number_note: string;
};