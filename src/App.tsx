/**
 * App.tsx
 * ---------------------------------------------------------------------------
 * The root of the app. It only does two things:
 *   1. Waits for authentication to finish loading (shows a splash screen).
 *   2. Declares the routes: which page appears at which address.
 *
 * All real work happens in the page files imported below.
 *
 * Folder map
 * ----------
 *   src/
 *   ├─ App.tsx                          <- this file (routes only)
 *   ├─ auth / api / types               <- your existing files (unchanged)
 *   ├─ config/site.ts                   <- siteUrl for QR codes
 *   ├─ utils/messageOf.ts               <- error -> friendly message
 *   ├─ components/
 *   │   ├─ layout/Shell.tsx             <- header + footer wrapper
 *   │   ├─ ui/                          <- Field, Alert, Card, Empty
 *   │   └─ dashboard/                   <- dashboardConfig + six tab components
 *   └─ pages/                           <- Landing, AuthPage, Dashboard,
 *                                          ScanPage, ReturnPage, NotFound
 *
 * Routes
 * ------
 *   /                         Landing      public home page
 *   /auth                     AuthPage     sign in / create account
 *   /dashboard                Dashboard    owner area (sign-in required)
 *   /scan/:token              ScanPage     public page opened by scanning a QR tag
 *   /subscription/return      ReturnPage   customer returns from PayFast
 *   /subscription/cancelled   ReturnPage   customer cancelled at PayFast
 *   *                         NotFound     anything else
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth";

import { Landing } from "./pages/Landing";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { ScanPage } from "./pages/ScanPage";
import { ReturnPage } from "./pages/ReturnPage";
import { NotFound } from "./pages/NotFound";

export default function App() {
  const { user, loading } = useAuth();

  // While we are still checking whether someone is signed in, show a splash
  // screen. This prevents a flash of the wrong page (e.g. sign-in page
  // appearing briefly for someone who is actually signed in).
  if (loading) {
    return (
      <div className="boot-screen">
        <span className="brand-mark">S</span>
        <p>Loading SafeLink…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Signed-in users do not need the sign-in page: send them to the dashboard */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      {/* Protected route: signed-out users are sent to the sign-in page */}
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/auth" replace />}
      />

      {/* Public: opened when someone scans a QR tag */}
      <Route path="/scan/:token" element={<ScanPage />} />

      {/* PayFast return addresses */}
      <Route path="/subscription/return" element={<ReturnPage />} />
      <Route path="/subscription/cancelled" element={<ReturnPage cancelled />} />

      {/* Catch-all for unknown addresses */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
