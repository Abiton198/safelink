# Netlify deployment quick checklist

**Build command:** `npm run build`
**Publish directory:** `dist`

Add these variables under Netlify site environment variables:

- `VITE_API_BASE_URL` = `https://safelink-backend-9jm3.onrender.com`
- `VITE_PUBLIC_SITE_URL` = your exact Netlify URL, for example `https://your-site.netlify.app`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

In Firebase Console, enable Email/Password sign-in and add the Netlify hostname to Authentication authorized domains.

In Render, set `CORS_ORIGINS_CSV` to the exact origins, e.g.
`http://localhost:5173,https://your-site.netlify.app`
Keep the current local origin if you are still developing locally. Do not include trailing slashes in origins.

The `public/_redirects` file supports React Router deep links on Netlify.
