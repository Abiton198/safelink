/**
 * hooks/useOnboarding.ts
 * ---------------------------------------------------------------------------
 * All the DATA and API ACTIONS the onboarding wizard needs, in one place.
 * The slides themselves (components/onboarding/Step*.tsx) only show forms and
 * call the functions returned here.
 *
 * It talks to the same endpoints as the dashboard:
 *   profile     PUT  /api/v1/profile/me
 *   contacts    POST /api/v1/profile/me/contacts   (+ DELETE .../:id)
 *   vehicles    POST /api/v1/profile/me/vehicles   (+ DELETE .../:id)
 *   claim tag   POST /api/v1/qr-tags/claim
 *   checkout    POST /api/v1/payments/payfast/checkout
 *
 * Because every "Save" goes straight to the backend, the person can leave at
 * any time and nothing they saved is lost.
 */
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth";
import { api } from "../api";
import type { Contact, Profile, QRTag, Subscription, Vehicle } from "../types";
import { messageOf } from "../utils/messageOf";
import {
    ACTIVE_STATUSES,
    type ClaimForm,
    type ContactForm,
    type VehicleForm,
} from "../components/dashboard/dashboardConfig";

/** Values collected by the "About you" slide. */
export type ProfileValues = {
    display_name: string;
    date_of_birth: string;
    emergency_summary: string;
    medical_notes: string;
    preferred_language: string;
};

export function useOnboarding() {
    const { user } = useAuth();

    // Data from the backend
    const [sub, setSub] = useState<Subscription | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [tags, setTags] = useState<QRTag[]>([]);

    // UI state
    const [loading, setLoading] = useState(true); // first load
    const [busy, setBusy] = useState(false); // a save is running
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    /** Loads everything. Each request may fail independently. */
    const load = useCallback(
        async (showSpinner: boolean) => {
            if (!user) return;
            if (showSpinner) setLoading(true);

            const [subR, profileR, contactsR, vehiclesR, tagsR] =
                await Promise.allSettled([
                    api<Subscription>(user, "/api/v1/subscriptions/me"),
                    api<Profile>(user, "/api/v1/profile/me"),
                    api<{ contacts: Contact[] }>(user, "/api/v1/profile/me/contacts"),
                    api<{ vehicles: Vehicle[] }>(user, "/api/v1/profile/me/vehicles"),
                    api<{ qr_tags: QRTag[] }>(user, "/api/v1/qr-tags"),
                ]);

            // No subscription yet is normal during onboarding.
            setSub(subR.status === "fulfilled" ? subR.value : null);
            if (profileR.status === "fulfilled") setProfile(profileR.value);
            if (contactsR.status === "fulfilled")
                setContacts(contactsR.value.contacts || []);
            if (vehiclesR.status === "fulfilled")
                setVehicles(vehiclesR.value.vehicles || []);
            if (tagsR.status === "fulfilled") setTags(tagsR.value.qr_tags || []);

            setLoading(false);
        },
        [user]
    );

    useEffect(() => {
        void load(true);
    }, [load]);

    /**
     * Runs one save action with the shared busy / error / notice handling,
     * then refreshes the data. Returns true if it worked.
     */
    async function run(
        action: () => Promise<unknown>,
        success?: string
    ): Promise<boolean> {
        if (!user) return false;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await action();
            if (success) setNotice(success);
            await load(false);
            return true;
        } catch (err) {
            setError(messageOf(err));
            return false;
        } finally {
            setBusy(false);
        }
    }

    /* ---------- Actions ---------- */

    const saveProfile = (values: ProfileValues) =>
        run(async () => {
            // The backend uses the date of birth to verify scanners, so it is required.
            if (!values.date_of_birth) {
                throw new Error("Please enter your date of birth to save.");
            }
            await api(user!, "/api/v1/profile/me", {
                method: "PUT",
                body: JSON.stringify(values),
            });
        }, "Profile saved.");

    const addContact = (form: ContactForm) =>
        run(
            () =>
                api(user!, "/api/v1/profile/me/contacts", {
                    method: "POST",
                    body: JSON.stringify({
                        ...form,
                        email: form.email || null,
                        priority: Number(form.priority),
                    }),
                }),
            "Contact added."
        );

    const deleteContact = (id: string) =>
        run(() =>
            api(user!, `/api/v1/profile/me/contacts/${id}`, { method: "DELETE" })
        );

    const addVehicle = (form: VehicleForm) =>
        run(
            () =>
                api(user!, "/api/v1/profile/me/vehicles", {
                    method: "POST",
                    body: JSON.stringify(form),
                }),
            "Vehicle added."
        );

    const deleteVehicle = (id: string) =>
        run(() =>
            api(user!, `/api/v1/profile/me/vehicles/${id}`, { method: "DELETE" })
        );

    const claimTag = (form: ClaimForm) =>
        run(
            () =>
                api(user!, "/api/v1/qr-tags/claim", {
                    method: "POST",
                    body: JSON.stringify({
                        tag_ref: form.tag_ref.trim(),
                        activation_code: form.activation_code.trim(),
                        label: form.label.trim() || "SafeLink tag",
                    }),
                }),
            "Tag claimed."
        );

    /**
     * Starts PayFast checkout: asks the backend for the signed fields, then
     * posts them to PayFast with a hidden form (the browser leaves this page).
     * Returns false if it could not start.
     */
    async function beginCheckout(): Promise<boolean> {
        if (!user) return false;

        setError("");
        setNotice("");

        try {
            await user.reload(); // refresh `emailVerified`

            if (!user.emailVerified) {
                setError("Please verify your email before starting checkout.");
                return false;
            }

            const result = await api<{
                process_url: string;
                fields: Record<string, string>;
            }>(user, "/api/v1/payments/payfast/checkout", {
                method: "POST",
                body: JSON.stringify({
                    plan_id: "safelink_monthly",
                    accepted_recurring_terms: true,
                    terms_version: "safelink-recurring-v1",
                }),
            });

            const form = document.createElement("form");
            form.method = "POST";
            form.action = result.process_url;

            for (const [key, value] of Object.entries(result.fields)) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
            return true;
        } catch (err) {
            setError(messageOf(err));
            return false;
        }
    }

    return {
        // data
        profile,
        contacts,
        vehicles,
        tags,
        sub,
        activeSub: !!sub && ACTIVE_STATUSES.includes(sub.status),
        // state
        loading,
        busy,
        error,
        notice,
        clearMessages: () => {
            setError("");
            setNotice("");
        },
        // actions
        saveProfile,
        addContact,
        deleteContact,
        addVehicle,
        deleteVehicle,
        claimTag,
        beginCheckout,
    };
}

/** The shape every slide receives. */
export type OnboardingApi = ReturnType<typeof useOnboarding>;