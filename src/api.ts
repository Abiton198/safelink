import type { User } from "firebase/auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://safelink-backend-9jm3.onrender.com").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(user: User | null, path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (user) headers.set("Authorization", `Bearer ${await user.getIdToken()}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not reach the SafeLink API. Check your connection and Render service.", 0);
  }

  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { detail: raw }; }
  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : `Request failed (${response.status}).`;
    throw new ApiError(detail, response.status);
  }
  return payload as T;
}

export function apiBaseUrl() { return API_BASE; }