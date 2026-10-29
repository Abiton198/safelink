/**
 * pages/Landing.tsx
 * ---------------------------------------------------------------------------
 * The public home page (route: "/").
 *
 * Sections:
 *   1. Hero text + call-to-action buttons
 *   2. Decorative tag card with a DEMO QR code
 *   3. "How it works" – three feature cards and a legal disclaimer
 *
 * The button changes depending on sign-in state:
 *   - signed in  -> "Open dashboard"
 *   - signed out -> "Get started" (goes to the sign-in / sign-up page)
 */
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

import { useAuth } from "../auth";
import { siteUrl } from "../config/site";
import { Shell } from "../components/layout/Shell";

export function Landing() {
  const { user } = useAuth();

  return (
    <Shell>
      <main className="landing">
        {/* ---------- Hero text ---------- */}
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse-dot" />
            PERSONAL SAFETY & RECOVERY
          </div>

          <h1>
            Help can start
            <br />
            <em>with one scan.</em>
          </h1>

          <p className="hero-sub">
            A simple QR tag that helps trusted responders reach the emergency
            information you choose to share.
          </p>

          <div className="hero-actions">
            <Link
              className="button primary"
              to={user ? "/dashboard" : "/auth"}
            >
              {user ? "Open dashboard" : "Get started"} <span>→</span>
            </Link>

            {/* "#how-it-works" scrolls to the section further down this page */}
            <a className="button secondary" href="#how-it-works">
              How it works
            </a>
          </div>

          <div className="trust-line">
            <span>✓</span> You control your profile
            <span>✓</span> Time-limited emergency access
          </div>
        </div>

        {/* ---------- Decorative artwork ---------- */}
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="tag-card">
            <div className="tag-header">
              <span className="brand-mark">S</span>
              <span>SAFELINK TAG</span>
            </div>

            {/* Demonstration only: this is NOT a real customer tag.
                The token "demo-tag-token-not-active" is also blocked in ScanPage. */}
            <div className="fake-qr">
              <QRCodeCanvas
                value={`${siteUrl}/scan/demo-tag-token-not-active`}
                size={150}
                bgColor="#ffffff"
                fgColor="#102b36"
                level="M"
              />
            </div>

            <div className="tag-bottom">
              <strong>Scan for assistance</strong>
              <span>Private · Secure · Ready</span>
            </div>
          </div>

          <div className="floating-note">
            <span className="note-icon">✦</span>
            <span>
              <strong>Your info, your choice</strong>
              <small>Share only what is needed</small>
            </span>
          </div>
        </div>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="how-section">
          <div className="section-heading">
            <div className="eyebrow">BUILT FOR REAL LIFE</div>
            <h2>
              One small tag.
              <br />A more prepared response.
            </h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>Claim your tag</h3>
              <p>
                Use the tag reference and concealed activation code supplied
                with your purchased SafeLink tag.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>Create your profile</h3>
              <p>
                Add emergency contacts, important notes, and vehicle or
                tracker details before subscribing.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Verify before sharing</h3>
              <p>
                A scan alone reveals no personal details. The backend checks
                access conditions before releasing emergency information.
              </p>
            </article>
          </div>

          <p className="disclaimer">
            SafeLink is an assistance and information tool, not an emergency
            dispatch service or a replacement for police, medical services,
            or a vehicle tracking provider.
          </p>
        </section>
      </main>
    </Shell>
  );
}
