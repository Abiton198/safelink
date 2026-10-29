/**
 * components/layout/Shell.tsx
 * ---------------------------------------------------------------------------
 * The shared page frame: top bar (logo + navigation), the page content, and
 * a footer. Every page wraps its content in <Shell> so the header and footer
 * look the same everywhere.
 *
 * The navigation changes depending on whether someone is signed in:
 *   - Signed in  -> "Dashboard" link and a "Sign out" button
 *   - Signed out -> "Sign in" link
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  const { user, logOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">S</span>
          <span>
            SafeLink
            <small>BE READY. STAY CONNECTED.</small>
          </span>
        </Link>

        <nav>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              {/* `void` tells TypeScript we are deliberately not awaiting the promise */}
              <button className="text-button" onClick={() => void logOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth">Sign in</Link>
          )}
        </nav>
      </header>

      {children}

      <footer className="footer">
        SafeLink · Keep emergency information accurate and up to date. In
        immediate danger, contact local emergency services.
      </footer>
    </div>
  );
}
