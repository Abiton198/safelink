/**
 * components/dashboard/ProfileTab.tsx
 * ---------------------------------------------------------------------------
 * Form for the owner's emergency profile: name, date of birth, language,
 * emergency summary and medical notes.
 *
 * NOTE about date of birth: the backend never returns it (it is used to
 * verify scanners). So this field starts empty and the owner must re-enter
 * it every time they save. Dashboard.tsx enforces this.
 */
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Profile } from "../../types";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

type ProfileTabProps = {
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;
  busy: boolean;
  /** Called when the form is submitted (saves to the API). */
  onSubmit: (e: FormEvent) => void;
};

export function ProfileTab({
  profile,
  setProfile,
  busy,
  onSubmit,
}: ProfileTabProps) {
  return (
    <Card
      title="Emergency profile"
      subtitle="You can prepare your profile before subscribing. Re-enter your date of birth whenever you save changes."
    >
      <form onSubmit={onSubmit} className="form-grid">
        <Field label="Display name">
          <input
            required
            maxLength={100}
            value={profile.display_name || ""}
            onChange={(e) =>
              setProfile({ ...profile, display_name: e.target.value })
            }
          />
        </Field>

        <Field label="Date of birth">
          <input
            type="date"
            required
            value={profile.date_of_birth || ""}
            onChange={(e) =>
              setProfile({ ...profile, date_of_birth: e.target.value })
            }
          />
        </Field>

        <Field label="Preferred language">
          <select
            value={profile.preferred_language || "en"}
            onChange={(e) =>
              setProfile({ ...profile, preferred_language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="af">Afrikaans</option>
            <option value="zu">isiZulu</option>
            <option value="xh">isiXhosa</option>
            <option value="st">Sesotho</option>
            <option value="tn">Setswana</option>
            <option value="sn">Shona</option>
          </select>
        </Field>

        <Field label="Emergency summary">
          <textarea
            rows={3}
            maxLength={1000}
            value={profile.emergency_summary || ""}
            onChange={(e) =>
              setProfile({ ...profile, emergency_summary: e.target.value })
            }
            placeholder="What should a responder know first?"
          />
        </Field>

        <Field label="Medical notes (optional)">
          <textarea
            rows={3}
            maxLength={1000}
            value={profile.medical_notes || ""}
            onChange={(e) =>
              setProfile({ ...profile, medical_notes: e.target.value })
            }
            placeholder="Only include information you are comfortable sharing in an emergency."
          />
        </Field>

        <div className="form-actions">
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </Card>
  );
}
