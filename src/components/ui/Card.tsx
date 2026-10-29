/**
 * components/ui/Card.tsx
 * ---------------------------------------------------------------------------
 * A titled content panel used throughout the dashboard.
 *
 * - `title`    : main heading of the card
 * - `subtitle` : optional grey helper text under the heading
 * - `action`   : optional element (e.g. a button) shown on the right of the heading
 * - `children` : the body of the card
 */
import type { ReactNode } from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Card({ title, subtitle, children, action }: CardProps) {
  return (
    <section className="panel content-card">
      <div className="card-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
