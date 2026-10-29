/**
 * components/ui/Field.tsx
 * ---------------------------------------------------------------------------
 * A labelled form control wrapper.
 *
 * Usage:
 *   <Field label="Email address">
 *     <input type="email" ... />
 *   </Field>
 *
 * Because the <input> sits inside a <label>, clicking the label text focuses
 * the input (good for accessibility and touch screens).
 */
import type { ReactNode } from "react";

type FieldProps = {
  /** Text shown above the input. */
  label: string;
  /** The input, select, or textarea to display. */
  children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
