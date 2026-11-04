/**
 * lib/uploadApi.ts
 * ---------------------------------------------------------------------------
 * Uploads one file to the backend as multipart form data.
 *
 * It does not use the shared `api()` helper on purpose: that helper is built
 * for JSON, and a file upload must let the browser set its own
 * `Content-Type: multipart/form-data; boundary=...` header.
 */
import type { User } from "firebase/auth";
import { apiBaseUrl } from "../api";

export async function uploadFile<T>(
    user: User,
    path: string,
    file: File,
    fieldName = "file"
): Promise<T> {
    const token = await user.getIdToken();

    const body = new FormData();
    body.append(fieldName, file);

    const response = await fetch(
        `${String(apiBaseUrl()).replace(/\/+$/, "")}${path}`,
        {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }, // no Content-Type here
            body,
        }
    );

    if (!response.ok) {
        let detail = "";
        try {
            const json = await response.json();
            if (typeof json?.detail === "string") detail = json.detail;
        } catch {
            /* not JSON */
        }
        throw new Error(detail || `Upload failed (${response.status}).`);
    }

    return (await response.json()) as T;
}