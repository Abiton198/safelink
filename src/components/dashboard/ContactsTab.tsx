/**
 * components/dashboard/ContactsTab.tsx
 * ---------------------------------------------------------------------------
 * Two cards:
 *   1. A form to add an emergency contact (with a "share with responders" switch)
 *   2. The list of saved contacts, each with a Delete button
 *
 * All saving/deleting logic lives in Dashboard.tsx; this component just
 * displays things and reports user actions through the props below.
 */
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Contact } from "../../types";
import type { ContactForm } from "./dashboardConfig";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Empty } from "../ui/Empty";

type ContactsTabProps = {
  contacts: Contact[];
  form: ContactForm;
  setForm: Dispatch<SetStateAction<ContactForm>>;
  busy: boolean;
  onAdd: (e: FormEvent) => void;
  onDelete: (id: string) => void;
};

export function ContactsTab({
  contacts,
  form,
  setForm,
  busy,
  onAdd,
  onDelete,
}: ContactsTabProps) {
  return (
    <>
      {/* ---------- Add contact ---------- */}
      <Card
        title="Emergency contacts"
        subtitle="Choose which contacts may be shown to a verified responder."
      >
        <form onSubmit={onAdd} className="form-grid">
          <Field label="Contact name">
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Relationship">
            <input
              maxLength={60}
              value={form.relationship}
              onChange={(e) =>
                setForm({ ...form, relationship: e.target.value })
              }
              placeholder="Family, friend…"
            />
          </Field>

          <Field label="Phone number">
            <input
              required
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>

          <Field label="Email (optional)">
            <input
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          <Field label="Priority (1 is highest)">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {[1, 2, 3, 4, 5].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </Field>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.share_with_responder}
              onChange={(e) =>
                setForm({ ...form, share_with_responder: e.target.checked })
              }
            />
            Share with verified responders
          </label>

          <div className="form-actions">
            <button className="button primary" disabled={busy}>
              Add contact
            </button>
          </div>
        </form>
      </Card>

      {/* ---------- Saved contacts ---------- */}
      <Card title={`Saved contacts (${contacts.length})`}>
        {contacts.length ? (
          <div className="record-list">
            {contacts.map((contact) => (
              <div className="record" key={contact.contact_id}>
                <div className="record-icon">♡</div>
                <div className="record-main">
                  <strong>{contact.name}</strong>
                  <span>
                    {contact.relationship || "Contact"} · {contact.phone}
                  </span>
                  <small>
                    {contact.share_with_responder
                      ? "Visible after verification"
                      : "Private from responders"}
                  </small>
                </div>

                <button
                  className="button danger small"
                  onClick={() => onDelete(contact.contact_id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="No contacts added yet." />
        )}
      </Card>
    </>
  );
}
