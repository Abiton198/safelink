/**
 * components/ui/Alert.tsx
 * ---------------------------------------------------------------------------
 * A coloured message box used for errors, success messages and information.
 * The `type` is added as a CSS class (`alert error`, `alert success`, ...),
 * so the colours are controlled in your stylesheet.
 */
import type { ReactNode } from "react";

type AlertProps = {
  type: "error" | "success" | "info";
  children: ReactNode;
};

export function Alert({ type, children }: AlertProps) {
  return <div className={`alert ${type}`}>{children}</div>;
}
