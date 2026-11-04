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
 *   photos      POST /api/v1/profile/me/vehicles/:id/images (max 5)  (+ DELETE .../:imageId)
 *   claim tag   POST /api/v1/qr-tags/claim
 *   checkout    POST /api/v1/payments/payfast/checkout          (card + free trial)
 *   prepaid     POST /api/v1/payments/payfast/checkout-prepaid  (any method, no trial)
 *
 * Because every "Save" goes straight to the backend, the person can leave at
 * any time and nothing they saved is lost.
 */
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth";
import { api } from "../api";
import type { Contact, Profile, QRTag, Subscription, Vehicle } from "../types";
import { messageOf } from "../utils/messageOf";
import { resizeImage } from "../utils/resizeImage";
import { uploadFile } from "../lib/uploadApi";
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

    /** Saves a vehicle. Returns its new id (so photos can be attached), or null. */
    async function addVehicle(form: VehicleForm): Promise<string | null> {
        let vehicleId: string | null = null;

        const saved = await run(async () => {
            const created = await api<{ vehicle_id: string }>(
                user!,
                "/api/v1/profile/me/vehicles",
                { method: "POST", body: JSON.stringify(form) }
            );
            vehicleId = created.vehicle_id;
        }, "Vehicle added.");

        return saved ? vehicleId : null;
    }

    /**
     * Uploads photos to a vehicle one at a time (kinder to mobile data than all
     * at once). Each photo is shrunk in the browser first. The server enforces
     * the maximum of 5 per vehicle.
     */
    async function uploadVehicleImages(
        vehicleId: string,
        files: File[]
    ): Promise<number> {
        if (!user || files.length === 0) return 0;

        setBusy(true);
        setError("");
        setNotice("");

        let uploaded = 0;
        let lastProblem = "";

        for (const file of files) {
            try {
                const small = await resizeImage(file);
                await uploadFile(
                    user,
                    `/api/v1/profile/me/vehicles/${vehicleId}/images`,
                    small
                );
                uploaded += 1;
            } catch (err) {
                lastProblem = messageOf(err);
            }
        }

        await load(false);
        setBusy(false);

        if (lastProblem) {
            setError(
                uploaded > 0
                    ? `${uploaded} of ${files.length} photos were added. ${lastProblem}`
                    : lastProblem
            );
        } else {
            setNotice(uploaded === 1 ? "Photo added." : `${uploaded} photos added.`);
        }

        return uploaded;
    }

    const deleteVehicleImage = (vehicleId: string, imageId: string) =>
        run(
            () =>
                api(
                    user!,
                    `/api/v1/profile/me/vehicles/${vehicleId}/images/${imageId}`,
                    { method: "DELETE" }
                ),
            "Photo removed."
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

    /** Posts signed fields to PayFast with a hidden form (the browser leaves this page). */
    function submitToPayFast(processUrl: string, fields: Record<string, string>) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = processUrl;

        for (const [key, value] of Object.entries(fields)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    }

    /**
     * Asks the backend for signed PayFast fields at `path`, then opens PayFast.
     * Returns false (and sets `error`) if it could not start.
     * Prices are never decided here: the backend signs the amount.
     */
    async function startPayFast(path: string, body: object): Promise<boolean> {
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
            }>(user, path, { method: "POST", body: JSON.stringify(body) });

            submitToPayFast(result.process_url, result.fields);
            return true;
        } catch (err) {
            setError(messageOf(err));
            return false;
        }
    }

    /** Card + free trial (automatic monthly billing, card only). */
    const beginCheckout = () =>
        startPayFast("/api/v1/payments/payfast/checkout", {
            plan_id: "safelink_monthly",
            accepted_recurring_terms: true,
            terms_version: "safelink-recurring-v1",
        });

    /** No card: prepay 1, 3 or 12 months with any method PayFast offers. */
    const beginPrepaidCheckout = (months: 1 | 3 | 12) =>
        startPayFast("/api/v1/payments/payfast/checkout-prepaid", {
            months,
            accepted_terms: true,
            terms_version: "safelink-prepaid-v1",
        });

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
        uploadVehicleImages,
        deleteVehicleImage,
        deleteVehicle,
        claimTag,
        beginCheckout,
        beginPrepaidCheckout,
    };
}

/** The shape every slide receives. */
export type OnboardingApi = ReturnType<typeof useOnboarding>;