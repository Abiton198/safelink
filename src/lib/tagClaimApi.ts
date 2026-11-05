/**
 * lib/tagClaimApi.ts
 * ---------------------------------------------------------------------------
 * The two calls behind "scan your tag to claim it".
 *
 *   lookupTag   token -> the tag's details, so the form can fill itself in.
 *               Changes nothing.
 *   confirmTag  token -> links the tag to the signed-in user and switches it on.
 *
 * Errors (not a SafeLink tag, already claimed by someone else, not available
 * yet) arrive as Error messages written for the person, ready to display.
 */
import type { User } from "firebase/auth";
import { api } from "../api";

export type ClaimPreview = {
    /** "available" = can be claimed now. "yours" = already linked to this user. */
    state: "available" | "yours";
    qr_id: string;
    tag_ref: string;
    label: string;
};

export const lookupTag = (user: User, token: string) =>
    api<ClaimPreview>(user, "/api/v1/qr-tags/claim/lookup", {
        method: "POST",
        body: JSON.stringify({ token }),
    });

export const confirmTag = (user: User, token: string, label: string) =>
    api<{ message: string; qr_id: string; tag_ref: string; label: string }>(
        user,
        "/api/v1/qr-tags/claim/confirm",
        { method: "POST", body: JSON.stringify({ token, label }) }
    );