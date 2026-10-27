export type Profile = {
  owner_uid?: string;
  display_name: string;
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
export type QRTag = {
  qr_id: string;
  label: string;
  active: boolean;
  scan_url?: string;
  created_at?: unknown;
  last_verified_at?: unknown;
};
export type Subscription = {
  status: string;
  subscription?: Record<string, any> | null;
};
export type EmergencyData = {
  profile: {
    display_name: string;
    emergency_summary: string;
    medical_notes: string;
    preferred_language: string;
  };
  emergency_contacts: Array<{ name: string; relationship: string; phone: string; priority: number }>;
  vehicles: Array<{
    label: string; make: string; model: string; colour: string;
    registration_number: string; tracker_provider: string; tracker_reference: string; notes: string;
  }>;
  access_expires_at: string;
  emergency_number_note: string;
};