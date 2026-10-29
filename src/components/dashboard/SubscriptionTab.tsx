/**
 * components/dashboard/SubscriptionTab.tsx
 * ---------------------------------------------------------------------------
 * Shows the subscription status and lets the owner:
 *   - start checkout with PayFast (only if not already active)
 *   - request cancellation (with an optional reason)
 *   - refresh the status from the backend
 *
 * The actual API calls live in Dashboard.tsx and arrive here as callbacks.
 */
import type { Subscription } from "../../types";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Alert } from "../ui/Alert";

type SubscriptionTabProps = {
  /** Subscription record from the API, or null if none exists yet. */
  sub: Subscription | null;
  /** True when the status allows emergency access. */
  active: boolean;
  cancelReason: string;
  setCancelReason: (value: string) => void;
  onCheckout: () => void;
  onCancel: () => void;
  onRefresh: () => void;
};

export function SubscriptionTab({
  sub,
  active,
  cancelReason,
  setCancelReason,
  onCheckout,
  onCancel,
  onRefresh,
}: SubscriptionTabProps) {
  return (
    <Card
      title="Subscription"
      subtitle="Complete your profile first, then activate emergency access."
    >
      {/* ---------- Summary ---------- */}
      <div className="subscription-detail">
        <div>
          <span className="muted">Current status</span>
          <strong>{sub?.status || "not started"}</strong>
        </div>

        <div>
          <span className="muted">Plan</span>
          <strong>{sub?.subscription?.plan_id || "SafeLink monthly"}</strong>
        </div>

        <div>
          <span className="muted">Monthly amount</span>
          <strong>R19.99</strong>
        </div>

        <div>
          <span className="muted">Trial</span>
          <strong>7 days (configured)</strong>
        </div>
      </div>

      {/* ---------- Not subscribed yet: show checkout ---------- */}
      {!active && (
        <>
          <h3>Ready to activate SafeLink?</h3>
          <p className="body-copy">
            Your profile can be prepared before payment. Continue to PayFast
            to start the configured subscription. Confirm the trial duration,
            recurring billing amount, and cancellation terms before accepting
            payment.
          </p>

          <button className="button primary" onClick={onCheckout}>
            Continue to PayFast <span>→</span>
          </button>
        </>
      )}

      {/* ---------- Subscribed ---------- */}
      {active && (
        <Alert type="success">
          Your subscription is currently marked as {sub?.status}. Emergency
          access still depends on the backend's tag and verification checks.
        </Alert>
      )}

      {/* ---------- Cancellation ---------- */}
      <p className="body-copy">
        Cancellation requests are recorded by the current starter backend, but
        they do not necessarily confirm cancellation of a PayFast recurring
        mandate. Confirm that the backend and payment-provider cancellation
        integration is complete before relying on this feature to stop future
        billing.
      </p>

      <Field label="Reason for cancellation (optional)">
        <textarea
          rows={2}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxLength={500}
        />
      </Field>

      <button className="button danger" onClick={onCancel}>
        Request cancellation
      </button>

      <button className="button secondary refresh-button" onClick={onRefresh}>
        Refresh status
      </button>
    </Card>
  );
}
