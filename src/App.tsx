import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "./auth";
import { api, apiBaseUrl } from "./api";
import type { Contact, EmergencyData, Profile, QRTag, Subscription, Vehicle } from "./types";

const siteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, "");

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function Shell({ children }: { children: ReactNode }) {
  const { user, logOut } = useAuth();
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">S</span><span>SafeLink<small>BE READY. STAY CONNECTED.</small></span></Link>
      <nav>
        {user ? <><Link to="/dashboard">Dashboard</Link><button className="text-button" onClick={() => void logOut()}>Sign out</button></> : <Link to="/auth">Sign in</Link>}
      </nav>
    </header>
    {children}
    <footer className="footer">SafeLink · Emergency information should be accurate and kept up to date. In immediate danger, contact local emergency services.</footer>
  </div>;
}

function Landing() {
  const { user } = useAuth();
  return <Shell><main className="landing">
    <div className="hero-copy">
      <div className="eyebrow"><span className="pulse-dot" /> PERSONAL SAFETY & RECOVERY</div>
      <h1>Help can start<br /><em>with one scan.</em></h1>
      <p className="hero-sub">A simple QR tag that helps trusted responders reach the emergency information you choose to share.</p>
      <div className="hero-actions"><Link className="button primary" to={user ? "/dashboard" : "/auth"}>{user ? "Open dashboard" : "Get started"} <span>→</span></Link><a className="button secondary" href="#how-it-works">How it works</a></div>
      <div className="trust-line"><span>✓</span> You control your profile <span>✓</span> Time-limited emergency access</div>
    </div>
    <div className="hero-art">
      <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
      <div className="tag-card"><div className="tag-header"><span className="brand-mark">S</span><span>SAFELINK TAG</span></div><div className="fake-qr"><QRCodeCanvas value={`${siteUrl}/scan/demo-tag-token-not-active`} size={150} bgColor="#ffffff" fgColor="#102b36" level="M" /></div><div className="tag-bottom"><strong>Scan for assistance</strong><span>Private · Secure · Ready</span></div></div>
      <div className="floating-note"><span className="note-icon">✦</span><span><strong>Your info, your choice</strong><small>Share only what is needed</small></span></div>
    </div>
    <section id="how-it-works" className="how-section">
      <div className="section-heading"><div className="eyebrow">BUILT FOR REAL LIFE</div><h2>One small tag.<br />A more prepared response.</h2></div>
      <div className="feature-grid">
        <article className="feature-card"><span className="feature-number">01</span><h3>Create your profile</h3><p>Add emergency contacts, important notes, and vehicle or tracker details in one place.</p></article>
        <article className="feature-card"><span className="feature-number">02</span><h3>Attach your QR tag</h3><p>Print your unique QR code on a small tag that can attach to a watch or personal item.</p></article>
        <article className="feature-card"><span className="feature-number">03</span><h3>Verify before sharing</h3><p>A scan alone reveals no personal details. Verification is required before limited emergency information is shown.</p></article>
      </div>
      <p className="disclaimer">SafeLink is an assistance and information tool, not an emergency dispatch service or a replacement for police, medical services, or a vehicle tracking provider.</p>
    </section>
  </main></Shell>;
}

function AuthPage() {
  const { user, signIn, signUp, sendVerification } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(name, email, password);
        setNotice("Account created. Check your email for a verification link. Verify your email before starting PayFast checkout.");
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  return <Shell><main className="auth-layout"><div className="auth-intro"><div className="eyebrow">YOUR SAFETY PROFILE</div><h1>Be prepared<br /><em>for the unexpected.</em></h1><p>Set up your SafeLink profile and choose the emergency details you want available when they are needed.</p><div className="auth-benefit">◈ <span>One profile for your contacts, vehicle and tag</span></div><div className="auth-benefit">◈ <span>Access controls built into the backend</span></div></div>
    <form className="panel auth-panel" onSubmit={submit}>
      <div className="tabs"><button type="button" className={mode === "signup" ? "tab active" : "tab"} onClick={() => setMode("signup")}>Create account</button><button type="button" className={mode === "signin" ? "tab active" : "tab"} onClick={() => setMode("signin")}>Sign in</button></div>
      <h2>{mode === "signup" ? "Start with SafeLink" : "Welcome back"}</h2><p className="muted">{mode === "signup" ? "Create your owner account." : "Sign in to manage your information."}</p>
      {mode === "signup" && <Field label="Full name"><input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></Field>}
      <Field label="Email address"><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
      <Field label="Password"><input type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
      {error && <Alert type="error">{error}</Alert>}{notice && <Alert type="success">{notice}<button type="button" className="inline-link" onClick={() => void sendVerification().then(() => setNotice("Verification email sent again. Check your inbox."))}>Resend verification email</button></Alert>}
      <button className="button primary full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account →" : "Sign in →"}</button>
      <p className="fine-print">By continuing, use SafeLink responsibly and keep your emergency details current. Never add information you do not want shared during an emergency.</p>
    </form></main></Shell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
function Alert({ type, children }: { type: "error" | "success" | "info"; children: ReactNode }) {
  return <div className={`alert ${type}`}>{children}</div>;
}
function Card({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel content-card"><div className="card-heading"><div><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function Dashboard() {
  const { user, sendVerification } = useAuth();
  const [tab, setTab] = useState("overview");
  const [sub, setSub] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile>({ display_name: user?.displayName || "", date_of_birth: "", emergency_summary: "", medical_notes: "", preferred_language: "en" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tags, setTags] = useState<QRTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "", email: "", priority: "1", share_with_responder: true });
  const [vehicleForm, setVehicleForm] = useState({ label: "", make: "", model: "", colour: "", registration_number: "", tracker_provider: "", tracker_reference: "", notes: "" });
  const [cancelReason, setCancelReason] = useState("");

  async function loadAll() {
    if (!user) return;
    setLoading(true); setError("");
    try {
      const s = await api<Subscription>(user, "/api/v1/subscriptions/me");
      setSub(s);
      if (["active", "trialing", "past_due_grace"].includes(s.status)) {
        const [p, c, v, q] = await Promise.all([
          api<Profile>(user, "/api/v1/profile/me"),
          api<{ contacts: Contact[] }>(user, "/api/v1/profile/me/contacts"),
          api<{ vehicles: Vehicle[] }>(user, "/api/v1/profile/me/vehicles"),
          api<{ qr_tags: QRTag[] }>(user, "/api/v1/qr-tags"),
        ]);
        setProfile({ ...p, date_of_birth: "" }); // DOB isn't returned; re-enter it when saving profile.
        setContacts(c.contacts || []); setVehicles(v.vehicles || []); setTags(q.qr_tags || []);
      }
    } catch (e) { setError(messageOf(e)); } finally { setLoading(false); }
  }
  useEffect(() => { void loadAll(); }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); if (!user) return; setBusy(true); setError(""); setNotice("");
    try {
      if (!profile.date_of_birth) throw new Error("Enter your date of birth to save or update your profile.");
      const payload = { display_name: profile.display_name, date_of_birth: profile.date_of_birth, emergency_summary: profile.emergency_summary, medical_notes: profile.medical_notes, preferred_language: profile.preferred_language };
      await api(user, "/api/v1/profile/me", { method: "PUT", body: JSON.stringify(payload) });
      setNotice("Emergency profile saved. The backend stores a protected DOB digest, not your raw date of birth.");
      setProfile(p => ({ ...p, date_of_birth: "" }));
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function addContact(e: FormEvent) {
    e.preventDefault(); if (!user) return; setBusy(true); setError(""); setNotice("");
    try {
      await api(user, "/api/v1/profile/me/contacts", { method: "POST", body: JSON.stringify({ ...contactForm, email: contactForm.email || null, priority: Number(contactForm.priority) }) });
      setContactForm({ name: "", relationship: "", phone: "", email: "", priority: "1", share_with_responder: true });
      setNotice("Emergency contact added."); await loadAll();
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function deleteContact(id: string) {
    if (!user || !confirm("Delete this emergency contact?")) return;
    try { await api(user, `/api/v1/profile/me/contacts/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e) { setError(messageOf(e)); }
  }
  async function addVehicle(e: FormEvent) {
    e.preventDefault(); if (!user) return; setBusy(true); setError(""); setNotice("");
    try {
      await api(user, "/api/v1/profile/me/vehicles", { method: "POST", body: JSON.stringify(vehicleForm) });
      setVehicleForm({ label: "", make: "", model: "", colour: "", registration_number: "", tracker_provider: "", tracker_reference: "", notes: "" });
      setNotice("Vehicle details added."); await loadAll();
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function deleteVehicle(id: string) {
    if (!user || !confirm("Delete this vehicle?")) return;
    try { await api(user, `/api/v1/profile/me/vehicles/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e) { setError(messageOf(e)); }
  }
  async function createTag(e: FormEvent) {
    e.preventDefault(); if (!user) return;
    const form = e.currentTarget as HTMLFormElement;
    const label = String(new FormData(form).get("tagLabel") || "SafeLink tag");
    setBusy(true); setError(""); setNotice(""); setNewTagUrl("");
    try {
      const result = await api<{ scan_url: string; qr_id: string; label: string }>(user, "/api/v1/qr-tags", { method: "POST", body: JSON.stringify({ label }) });
      setNewTagUrl(result.scan_url);
      setNotice("Tag created. Download or print the QR code now; the raw token cannot be retrieved later.");
      await loadAll();
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function deactivateTag(id: string) {
    if (!user || !confirm("Deactivate this QR tag? It will no longer grant emergency access.")) return;
    try { await api(user, `/api/v1/qr-tags/${id}/deactivate`, { method: "POST" }); await loadAll(); }
    catch (e) { setError(messageOf(e)); }
  }
  async function beginCheckout() {
    if (!user) return;
    setError(""); setNotice("");
    try {
      await user.reload();
      if (!user.emailVerified) {
        setError("Please verify your email before starting checkout. Use the verification link sent when you registered.");
        return;
      }
      const result = await api<{ process_url: string; fields: Record<string, string> }>(user, "/api/v1/payments/payfast/checkout", {
        method: "POST",
        body: JSON.stringify({ plan_id: "safelink_monthly", accepted_recurring_terms: true, terms_version: "safelink-recurring-v1" }),
      });
      const form = document.createElement("form");
      form.method = "POST"; form.action = result.process_url;
      for (const [key, value] of Object.entries(result.fields)) {
        const input = document.createElement("input"); input.type = "hidden"; input.name = key; input.value = value; form.appendChild(input);
      }
      document.body.appendChild(form); form.submit();
    } catch (e) { setError(messageOf(e)); }
  }
  async function requestCancellation() {
    if (!user) return;
    try {
      const result = await api<{ message: string }>(user, "/api/v1/subscriptions/cancel", { method: "POST", body: JSON.stringify({ reason: cancelReason || null }) });
      setNotice(result.message); setCancelReason(""); await loadAll();
    } catch (e) { setError(messageOf(e)); }
  }

  if (loading) return <Shell><main className="dashboard-wrap"><div className="loading-card">Loading your SafeLink dashboard…</div></main></Shell>;

  const active = !!sub && ["active", "trialing", "past_due_grace"].includes(sub.status);
  const nav = [
    ["overview", "Overview", "⌂"], ["profile", "Emergency profile", "◉"], ["contacts", "Contacts", "♡"],
    ["vehicles", "Vehicles & trackers", "◇"], ["tags", "QR tags", "▦"], ["subscription", "Subscription", "↗"],
  ];
  return <Shell><main className="dashboard-wrap">
    <div className="dash-welcome"><div><div className="eyebrow">OWNER DASHBOARD</div><h1>Hello, {user?.displayName || user?.email?.split("@")[0] || "there"}.</h1><p>Manage your emergency details and SafeLink tags from one place.</p></div><div className={`status-pill ${active ? "good" : "waiting"}`}><span /> {sub?.status || "subscription not started"}</div></div>
    {error && <Alert type="error">{error}</Alert>}{notice && <Alert type="success">{notice}</Alert>}
    {!user?.emailVerified && <Alert type="info">Your email is not verified. Verify it before starting checkout. <button className="inline-link" onClick={() => void sendVerification().then(() => setNotice("Verification email sent."))}>Send verification email</button></Alert>}
    {!active ? <div className="subscription-gate panel"><div className="gate-icon">↗</div><div><div className="eyebrow">ACTIVATE YOUR SAFE LINK</div><h2>Start your 7-day trial</h2><p>Your emergency profile and QR management unlock after your subscription becomes active. The starter checkout is configured for R19.99/month after the trial, subject to the PayFast setup and verification flow being completed.</p><p className="muted">By selecting checkout you agree to recurring monthly billing after the trial unless cancelled. The current backend cancellation endpoint records a request but does not yet cancel the PayFast mandate.</p><button className="button primary" onClick={() => void beginCheckout()}>Continue to PayFast <span>→</span></button></div></div> : <div className="dash-grid">
      <aside className="dash-nav panel">{nav.map(([id, label, icon]) => <button key={id} className={tab === id ? "nav-item selected" : "nav-item"} onClick={() => setTab(id)}><span>{icon}</span>{label}{tab === id && <b>›</b>}</button>)}<div className="nav-help"><strong>Need help?</strong><p>Keep emergency contacts and vehicle details up to date.</p></div></aside>
      <div className="dash-content">
        {tab === "overview" && <><div className="metric-grid"><div className="metric-card"><span>EMERGENCY CONTACTS</span><strong>{contacts.length}</strong><small>Saved contacts</small></div><div className="metric-card"><span>VEHICLES</span><strong>{vehicles.length}</strong><small>Vehicles & trackers</small></div><div className="metric-card"><span>QR TAGS</span><strong>{tags.filter(t => t.active).length}</strong><small>Active tags</small></div></div><Card title="Your safety setup" subtitle="Complete these essentials before printing a tag."><div className="check-list"><div><span className={profile.display_name ? "check done" : "check"}>{profile.display_name ? "✓" : "1"}</span><span><strong>Emergency profile</strong><small>Add your name and emergency information.</small></span><button className="inline-link" onClick={() => setTab("profile")}>Edit profile</button></div><div><span className={contacts.length ? "check done" : "check"}>{contacts.length ? "✓" : "2"}</span><span><strong>Emergency contacts</strong><small>Add at least one trusted contact.</small></span><button className="inline-link" onClick={() => setTab("contacts")}>Manage</button></div><div><span className={tags.length ? "check done" : "check"}>{tags.length ? "✓" : "3"}</span><span><strong>Create your QR tag</strong><small>Save and print the unique QR code.</small></span><button className="inline-link" onClick={() => setTab("tags")}>Create tag</button></div></div></Card><Card title="Privacy reminder" subtitle="Your QR code does not contain your date of birth or emergency details."><p className="body-copy">A person who scans your tag must verify the date of birth before the backend releases limited emergency information. Date of birth is not a strong secret; only add information that is appropriate for emergency disclosure.</p></Card></>}
        {tab === "profile" && <Card title="Emergency profile" subtitle="Your date of birth is used to verify a QR scan and is never returned by the profile endpoint."><form onSubmit={saveProfile} className="form-grid"><Field label="Display name"><input required maxLength={100} value={profile.display_name || ""} onChange={e => setProfile({ ...profile, display_name: e.target.value })} /></Field><Field label="Date of birth (re-enter to save)"><input type="date" required value={profile.date_of_birth || ""} onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })} /></Field><Field label="Preferred language"><select value={profile.preferred_language || "en"} onChange={e => setProfile({ ...profile, preferred_language: e.target.value })}><option value="en">English</option><option value="af">Afrikaans</option><option value="zu">isiZulu</option><option value="xh">isiXhosa</option><option value="st">Sesotho</option><option value="tn">Setswana</option><option value="sn">Shona</option></select></Field><Field label="Emergency summary"><textarea rows={3} maxLength={1000} value={profile.emergency_summary || ""} onChange={e => setProfile({ ...profile, emergency_summary: e.target.value })} placeholder="What should a responder know first?" /></Field><Field label="Medical notes (optional)"><textarea rows={3} maxLength={1000} value={profile.medical_notes || ""} onChange={e => setProfile({ ...profile, medical_notes: e.target.value })} placeholder="Only include information you are comfortable sharing in an emergency." /></Field><div className="form-actions"><button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div></form></Card>}
        {tab === "contacts" && <><Card title="Emergency contacts" subtitle="Choose which contacts may be shown to a verified responder."><form onSubmit={addContact} className="form-grid"><Field label="Contact name"><input required maxLength={100} value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} /></Field><Field label="Relationship"><input maxLength={60} value={contactForm.relationship} onChange={e => setContactForm({ ...contactForm, relationship: e.target.value })} placeholder="Family, friend…" /></Field><Field label="Phone number"><input required type="tel" maxLength={30} value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} /></Field><Field label="Email (optional)"><input type="email" maxLength={254} value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} /></Field><Field label="Priority (1 is highest)"><select value={contactForm.priority} onChange={e => setContactForm({ ...contactForm, priority: e.target.value })}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></Field><label className="checkbox-field"><input type="checkbox" checked={contactForm.share_with_responder} onChange={e => setContactForm({ ...contactForm, share_with_responder: e.target.checked })} /> Share with verified responders</label><div className="form-actions"><button className="button primary" disabled={busy}>Add contact</button></div></form></Card><Card title={`Saved contacts (${contacts.length})`}>{contacts.length ? <div className="record-list">{contacts.map(c => <div className="record" key={c.contact_id}><div className="record-icon">♡</div><div className="record-main"><strong>{c.name}</strong><span>{c.relationship || "Contact"} · {c.phone}</span><small>{c.share_with_responder ? "Visible after verification" : "Private from responders"}</small></div><button className="button danger small" onClick={() => void deleteContact(c.contact_id)}>Delete</button></div>)}</div> : <Empty text="No contacts added yet." />}</Card></>}
        {tab === "vehicles" && <><Card title="Vehicles & trackers" subtitle="Add information that may help with vehicle recovery."><form onSubmit={addVehicle} className="form-grid"><Field label="Label"><input required maxLength={80} value={vehicleForm.label} onChange={e => setVehicleForm({ ...vehicleForm, label: e.target.value })} placeholder="My car" /></Field><Field label="Make"><input maxLength={60} value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></Field><Field label="Model"><input maxLength={60} value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></Field><Field label="Colour"><input maxLength={40} value={vehicleForm.colour} onChange={e => setVehicleForm({ ...vehicleForm, colour: e.target.value })} /></Field><Field label="Registration number"><input maxLength={30} value={vehicleForm.registration_number} onChange={e => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })} /></Field><Field label="Tracker provider"><input maxLength={100} value={vehicleForm.tracker_provider} onChange={e => setVehicleForm({ ...vehicleForm, tracker_provider: e.target.value })} /></Field><Field label="Tracker reference"><input maxLength={100} value={vehicleForm.tracker_reference} onChange={e => setVehicleForm({ ...vehicleForm, tracker_reference: e.target.value })} /></Field><Field label="Additional notes"><textarea rows={2} maxLength={500} value={vehicleForm.notes} onChange={e => setVehicleForm({ ...vehicleForm, notes: e.target.value })} /></Field><div className="form-actions"><button className="button primary" disabled={busy}>Add vehicle</button></div></form></Card><Card title={`Saved vehicles (${vehicles.length})`}>{vehicles.length ? <div className="record-list">{vehicles.map(v => <div className="record" key={v.vehicle_id}><div className="record-icon">◇</div><div className="record-main"><strong>{v.label}</strong><span>{[v.make, v.model, v.colour].filter(Boolean).join(" · ") || "Vehicle details"}</span><small>{v.registration_number || "No registration entered"}{v.tracker_provider ? ` · ${v.tracker_provider}` : ""}</small></div><button className="button danger small" onClick={() => void deleteVehicle(v.vehicle_id)}>Delete</button></div>)}</div> : <Empty text="No vehicles added yet." />}</Card></>}
        {tab === "tags" && <><Card title="Your QR tags" subtitle="The QR token is shown only at creation. Save it immediately."><form className="inline-form" onSubmit={createTag}><Field label="Tag label"><input name="tagLabel" maxLength={80} defaultValue="SafeLink watch tag" /></Field><button className="button primary" disabled={busy}>+ Create QR tag</button></form>{newTagUrl && <div className="new-qr"><div className="qr-paper"><QRCodeCanvas id="new-qr-canvas" value={newTagUrl} size={200} level="H" includeMargin /></div><div><h3>Your new QR tag</h3><p className="muted">Download the code and keep the scan URL private until the tag is attached to your item.</p><div className="button-row"><button className="button secondary" onClick={() => { const canvas = document.getElementById("new-qr-canvas") as HTMLCanvasElement | null; if (!canvas) return; const a = document.createElement("a"); a.download = "safelink-qr-tag.png"; a.href = canvas.toDataURL("image/png"); a.click(); }}>Download PNG</button><button className="button secondary" onClick={() => void navigator.clipboard.writeText(newTagUrl).then(() => setNotice("QR scan URL copied."))}>Copy URL</button></div><p className="qr-url">{newTagUrl}</p></div></div>}</Card><Card title={`Registered tags (${tags.length})`}>{tags.length ? <div className="record-list">{tags.map(t => <div className="record" key={t.qr_id}><div className="record-icon">▦</div><div className="record-main"><strong>{t.label}</strong><span>{t.active ? "Active" : "Deactivated"}</span><small>Tag ID: {t.qr_id.slice(0, 12)}…</small></div>{t.active && <button className="button danger small" onClick={() => void deactivateTag(t.qr_id)}>Deactivate</button>}</div>)}</div> : <Empty text="No QR tags created yet." />}</Card></>}
        {tab === "subscription" && <Card title="Subscription" subtitle="View the status returned by your backend."><div className="subscription-detail"><div><span className="muted">Current status</span><strong>{sub?.status || "not started"}</strong></div><div><span className="muted">Plan</span><strong>{sub?.subscription?.plan_id || "SafeLink monthly"}</strong></div><div><span className="muted">Monthly amount</span><strong>R19.99</strong></div><div><span className="muted">Trial</span><strong>7 days (configured)</strong></div></div><p className="body-copy">Cancellation requests are recorded by the current starter backend, but they do not yet confirm cancellation of a PayFast recurring mandate. Do not rely on this screen alone to stop future billing until the provider cancellation integration is finished.</p><Field label="Reason for cancellation (optional)"><textarea rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} maxLength={500} /></Field><button className="button danger" onClick={() => void requestCancellation()}>Request cancellation</button><button className="button secondary refresh-button" onClick={() => void loadAll()}>Refresh status</button></Card>}
      </div>
    </div>}
    <div className="api-note">Connected API: <code>{apiBaseUrl()}</code></div>
  </main></Shell>;
}

function Empty({ text }: { text: string }) { return <div className="empty-state"><span>◌</span><p>{text}</p></div>; }

function ScanPage() {
  const { token = "" } = useParams();
  const [dob, setDob] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [data, setData] = useState<EmergencyData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function verify(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice(""); setData(null);
    try {
      const result = await api<{ access_token: string; expires_in_seconds: number }>(null, `/api/v1/public/qr/${encodeURIComponent(token)}/verify`, { method: "POST", body: JSON.stringify({ date_of_birth: dob }) });
      setAccessToken(result.access_token); setNotice("Verification successful. Loading the permitted emergency information…");
      const details = await api<EmergencyData>(null, `/api/v1/public/emergency?access_token=${encodeURIComponent(result.access_token)}`);
      setData(details);
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  return <Shell><main className="scan-wrap">
    <div className="scan-brand"><span className="brand-mark">S</span><span>SafeLink</span></div>
    {!data ? <form className="panel scan-panel" onSubmit={verify}><div className="scan-symbol">▦</div><div className="eyebrow">SAFE LINK EMERGENCY TAG</div><h1>Verify to continue</h1><p className="muted">This tag does not display personal details just because it was scanned. Enter the tag owner's date of birth to request access to the limited emergency information they chose to share.</p><Field label="Owner's date of birth"><input type="date" required value={dob} onChange={e => setDob(e.target.value)} /></Field>{error && <Alert type="error">{error}</Alert>}{notice && <Alert type="info">{notice}</Alert>}<button className="button primary full" disabled={busy || !token || token === "demo-tag-token-not-active"}>{busy ? "Verifying…" : "Verify and view emergency details"}</button><p className="fine-print">If this is an emergency, contact local emergency services. SafeLink does not dispatch responders.</p></form> : <div className="panel emergency-panel"><div className="emergency-banner"><span>✓</span><div><strong>Verification complete</strong><small>Access expires {new Date(data.access_expires_at).toLocaleString()}</small></div></div><div className="emergency-person"><div className="person-avatar">{data.profile.display_name?.slice(0,1).toUpperCase() || "S"}</div><div><div className="eyebrow">EMERGENCY PROFILE</div><h1>{data.profile.display_name}</h1></div></div>{data.profile.emergency_summary && <section className="emergency-section"><h2>Important information</h2><p>{data.profile.emergency_summary}</p></section>}{data.profile.medical_notes && <section className="emergency-section medical"><h2>Medical notes</h2><p>{data.profile.medical_notes}</p></section>}<section className="emergency-section"><h2>Emergency contacts</h2>{data.emergency_contacts.length ? data.emergency_contacts.map((c,i) => <div className="emergency-record" key={`${c.phone}-${i}`}><div><strong>{c.name}</strong><small>{c.relationship} · Priority {c.priority}</small></div><a className="button primary small" href={`tel:${c.phone.replace(/[^+\d]/g,"")}`}>Call {c.name.split(" ")[0]}</a></div>) : <p className="muted">No contacts have been shared.</p>}</section><section className="emergency-section"><h2>Vehicles & trackers</h2>{data.vehicles.length ? data.vehicles.map((v,i) => <div className="vehicle-detail" key={`${v.label}-${i}`}><strong>{v.label}</strong><p>{[v.make,v.model,v.colour].filter(Boolean).join(" · ")}</p>{v.registration_number && <p>Registration: <b>{v.registration_number}</b></p>}{v.tracker_provider && <p>Tracker: {v.tracker_provider} {v.tracker_reference}</p>}{v.notes && <p>{v.notes}</p>}</div>) : <p className="muted">No vehicle information has been shared.</p>}</section><button className="button secondary full" onClick={() => { setData(null); setAccessToken(""); setDob(""); setNotice(""); }}>Close emergency view</button><p className="fine-print">{data.emergency_number_note} This page contains private information. Do not take screenshots or share it unnecessarily.</p></div>}
    <p className="scan-foot">SafeLink · Limited emergency information only</p>
  </main></Shell>;
}

function ReturnPage({ cancelled = false }: { cancelled?: boolean }) {
  const { user } = useAuth();
  return <Shell><main className="simple-page panel"><div className="scan-symbol">{cancelled ? "↩" : "✓"}</div><h1>{cancelled ? "Checkout cancelled" : "Return received"}</h1><p className="muted">{cancelled ? "You returned from PayFast without completing checkout. Your subscription is not confirmed active." : "You have returned from PayFast. The browser redirect alone does not confirm payment or activate your subscription."}</p>{user && <Link className="button primary" to="/dashboard">Return to dashboard</Link>}<Link className="inline-link" to="/">Back to home</Link></main></Shell>;
}

function NotFound() {
  return <Shell><main className="simple-page"><h1>Page not found</h1><Link to="/" className="button primary">Back to SafeLink</Link></main></Shell>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><span className="brand-mark">S</span><p>Loading SafeLink…</p></div>;
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
    <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
    <Route path="/scan/:token" element={<ScanPage />} />
    <Route path="/subscription/return" element={<ReturnPage />} />
    <Route path="/subscription/cancelled" element={<ReturnPage cancelled />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}