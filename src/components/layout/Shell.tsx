/**
 * components/layout/Shell.tsx
 * ---------------------------------------------------------------------------
 * The shared page frame: top bar (logo + navigation), the page content, and
 * a footer. Every page wraps its content in <Shell> so the header and footer
 * look the same everywhere.
 *
 * The navigation changes depending on whether someone is signed in:
 * Signed in  -> "Dashboard" link and a "Sign out" button
 * Signed out -> "Sign in" link
 */
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await logOut();
      navigate("/");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  }

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
              {/* Calls logOut and navigates back to the home page */}
              <button className="text-button" onClick={() => void handleSignOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/">Scan!</Link>
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