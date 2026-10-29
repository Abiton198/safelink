import type { User } from "firebase/auth";

/**
 * SafeLink API configuration.
 *
 * Local development:
 *   Set VITE_API_BASE_URL in .env.local if required.
 *
 * Production:
 *   The default points to the deployed SafeLink backend.
 *
 * Do not put Firebase service-account credentials, PayFast secrets,
 * or other server-side secrets in Vite environment variables.
 */
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://safelink-backend-9jm3.onrender.com"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Safely extract a useful error message from common FastAPI responses.
 *
 * FastAPI can return:
 *   { "detail": "Some message" }
 *
 * Validation errors can return:
 *   { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
 */
function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;

    if (typeof body.detail === "string") {
      return body.detail;
    }

    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => {
          if (!item || typeof item !== "object") return "";

          const error = item as Record<string, unknown>;
          const location = Array.isArray(error.loc)
            ? error.loc.filter((part) => part !== "body").join(" → ")
            : "";

          const message =
            typeof error.msg === "string"
              ? error.msg
              : "Invalid value";

          return location ? `${location}: ${message}` : message;
        })
        .filter(Boolean);

      if (messages.length) {
        return messages.join("; ");
      }
    }

    if (typeof body.message === "string") {
      return body.message;
    }
  }

  switch (status) {
    case 400:
      return "The request could not be processed. Check the information entered.";
    case 401:
      return "Your session may have expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found. Check that the API endpoint is implemented.";
    case 409:
      return "This request conflicts with the current status of the resource. Check the details and try again.";
    case 422:
      return "Some information is missing or invalid. Check the form and try again.";
    case 429:
      return "Too many attempts. Please wait before trying again.";
    default:
      if (status >= 500) {
        return "The SafeLink server encountered a problem. Please try again later.";
      }

      return `Request failed (${status}).`;
  }
}

/**
 * Make a request to the SafeLink FastAPI backend.
 *
 * Pass a Firebase user for authenticated owner operations.
 * Pass null for public QR verification and emergency access operations.
 *
 * Authentication and permissions must always be verified by the backend.
 */
export async function api<T>(
  user: User | null,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Prevent accidentally constructing requests to an unexpected host.
  if (!path.startsWith("/")) {
    throw new ApiError(
      "API paths must start with a forward slash.",
      0,
    );
  }

  const headers = new Headers(options.headers || {});

  // Set JSON content type only when sending a JSON-style body.
  // Do not apply this automatically to FormData uploads.
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Firebase issues the ID token; the backend verifies it.
  // Never send a client-supplied UID as a substitute for authentication.
  if (user) {
    try {
      headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
    } catch {
      throw new ApiError(
        "Could not obtain your authentication token. Please sign in again.",
        401,
      );
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Could not reach the SafeLink API. Check your internet connection and confirm that the backend service is running.",
      0,
    );
  }

  // Read the body once so both JSON and plain-text responses are supported.
  const raw = await response.text();

  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }

  // A 204 response has no JSON body.
  if (response.status === 204 || !raw) {
    return undefined as T;
  }

  return payload as T;
}

/**
 * Returns the configured backend URL for diagnostics in the dashboard.
 */
export function apiBaseUrl(): string {
  return API_BASE;
}