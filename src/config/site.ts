/**
 * config/site.ts
 * ---------------------------------------------------------------------------
 * Site-wide configuration values.
 *
 * `siteUrl` is the public base address of the app. It is used to build the
 * address that is encoded inside QR codes (e.g. `${siteUrl}/scan/<token>`).
 *
 * - In production, set VITE_PUBLIC_SITE_URL in your .env file.
 * - If it is not set, we fall back to the address the browser is on.
 * - Trailing slashes are removed so we never end up with "//scan/...".
 */
export const siteUrl: string = (
  import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin
).replace(/\/+$/, "");
