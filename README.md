# SafeLink frontend (Stage 1)

React + TypeScript + Vite frontend designed to use the SafeLink Stage 2 FastAPI routes.

## 1. Configure Firebase

In Firebase Console, select your SafeLink project, go to Project settings → General → Your apps, and register a **Web app** if you have not already. Copy the web-app configuration values into `.env.local` (see `.env.example`).

Enable **Authentication → Sign-in method → Email/Password**. Configure an authorized domain for your eventual Netlify site in Firebase Authentication settings.

Firebase web config is intended to be used by the browser; do **not** put a Firebase Admin service-account JSON in this project.

## 2. Run locally

Install Node.js 20+ first. In this directory:

```bash
cp .env.example .env.local
# Edit .env.local and fill the Firebase web config values
npm install
npm run dev
```

Open the localhost URL printed by Vite (usually `http://localhost:5173`).

## 3. Deploy to Netlify

1. Push this frontend folder to its own GitHub repository.
2. In Netlify, import the repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add the environment variables from `.env.example` in Netlify → Site configuration → Environment variables. Set:
   - `VITE_API_BASE_URL=https://safelink-backend-9jm3.onrender.com`
   - `VITE_PUBLIC_SITE_URL=https://YOUR-REAL-SITE.netlify.app`
   - all six Firebase web-app values.
6. Add a Netlify SPA redirect file `public/_redirects` with `/* /index.html 200` (already included in this starter).
7. Add the final Netlify hostname to Firebase Authentication → Settings → Authorized domains.
8. Add the exact Netlify origin to the backend Render variable `CORS_ORIGINS_CSV` (alongside localhost during development). Example:
   `http://localhost:5173,https://YOUR-REAL-SITE.netlify.app`
9. Redeploy the backend after changing its environment settings, then redeploy the frontend after changing frontend variables.

## 4. Implemented screens

- Landing page
- Email/password sign-up and sign-in
- Email verification prompt
- Owner dashboard with profile, contacts, vehicles, QR tags, and subscription status
- QR code PNG generation/download
- Public QR scan page with DOB verification and limited emergency detail display
- PayFast checkout handoff to the backend-generated signed fields
- Subscription return/cancel pages

## 5. Important backend alignment notes

The frontend calls the following exact routes:
- `GET /api/v1/health`
- `GET /api/v1/subscriptions/me`
- `POST /api/v1/payments/payfast/checkout`
- `POST /api/v1/subscriptions/cancel`
- `GET|PUT /api/v1/profile/me`
- `GET|POST /api/v1/profile/me/contacts`
- `PATCH|DELETE /api/v1/profile/me/contacts/{contact_id}`
- `GET|POST /api/v1/profile/me/vehicles`
- `PATCH|DELETE /api/v1/profile/me/vehicles/{vehicle_id}`
- `GET|POST /api/v1/qr-tags`
- `POST /api/v1/qr-tags/{qr_id}/deactivate`
- `POST /api/v1/public/qr/{token}/verify`
- `GET /api/v1/public/emergency?access_token=...`

Owner routes require a Firebase ID token and a subscription record in an allowed state. The starter backend doesn't yet fully activate a PayFast free trial or securely cancel recurring billing. Checkout may fail until PayFast variables are configured, and a successful browser return is not proof that the subscription is active. Do not advertise live recurring billing until the provider verification and cancellation lifecycle have been finished and tested.

## 6. QR scan route

The generated tag opens `/scan/{token}`. QR tokens are bearer identifiers; the date of birth is the second check. Date of birth is not strong authentication, so the frontend and backend deliberately limit displayed data and use a short-lived access token. Before production, prefer sending the access token in an Authorization header instead of a query string, and disable sensitive URL logging.

## 7. Troubleshooting

- **CORS error:** add the exact frontend origin to Render `CORS_ORIGINS_CSV`, no trailing slash; redeploy backend.
- **Firebase `auth/unauthorized-domain`:** add the current frontend hostname to Firebase Auth authorized domains.
- **401:** sign in again; Firebase ID token may have expired.
- **402:** backend says there is no active/trialing subscription; this is intentional.
- **503 on DOB verification:** set `DOB_HMAC_SECRET` in Render.
- **Profile returns 404:** create/save profile after subscription access is active.
- **QR URL goes to the wrong site:** update `VITE_PUBLIC_SITE_URL` in Netlify and rebuild/redeploy.
