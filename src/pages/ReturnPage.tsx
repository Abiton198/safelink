/**
 * pages/ReturnPage.tsx
 * ---------------------------------------------------------------------------
 * Where PayFast sends the customer after checkout.
 *
 *   /subscription/return    -> <ReturnPage />
 *   /subscription/cancelled -> <ReturnPage cancelled />
 *
 * IMPORTANT: Arriving on this page is NOT proof of payment. Anyone can type
 * this address into a browser. The real confirmation comes from PayFast's
 * server-to-server notification (ITN) handled by your backend. That is why
 * the wording here never says "payment successful".
 */
import { Link } from "react-router-dom";
import { Shell } from "../components/layout/Shell";
import { useAuth } from "../auth";

type ReturnPageProps = {
  /** True when the customer pressed "cancel" at PayFast. */
  cancelled?: boolean;
};

export function ReturnPage({ cancelled = false }: ReturnPageProps) {
  const { user } = useAuth();

  return (
    <Shell>
      <main className="simple-page panel">
        <div className="scan-symbol">{cancelled ? "↩" : "✓"}</div>

        <h1>{cancelled ? "Checkout cancelled" : "Return received"}</h1>

        <p className="muted">
          {cancelled
            ? "You returned from PayFast without completing checkout. Your subscription is not confirmed active."
            : "You have returned from PayFast. The browser redirect alone does not confirm payment or activate your subscription."}
        </p>

        {/* Only signed-in users have a dashboard to return to */}
        {user && (
          <Link className="button primary" to="/dashboard">
            Return to dashboard
          </Link>
        )}

        <Link className="inline-link" to="/">
          Back to home
        </Link>
      </main>
    </Shell>
  );
}
