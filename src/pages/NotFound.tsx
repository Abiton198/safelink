/**
 * pages/NotFound.tsx
 * ---------------------------------------------------------------------------
 * Shown for any address that does not match a route in App.tsx (the "*" route).
 */
import { Link } from "react-router-dom";
import { Shell } from "../components/layout/Shell";

export function NotFound() {
  return (
    <Shell>
      <main className="simple-page">
        <h1>Page not found</h1>
        <Link to="/" className="button primary">
          Back to SafeLink
        </Link>
      </main>
    </Shell>
  );
}
