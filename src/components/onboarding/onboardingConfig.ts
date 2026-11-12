/**
 * components/onboarding/onboardingConfig.ts
 * ---------------------------------------------------------------------------
 * The list of onboarding slides, in order. To add, remove or reorder a step,
 * change this list (and the matching case in pages/Onboarding.tsx).
 *
 * Each step has a colour theme (`id` is used as the CSS class `grad-<id>`).
 */

export type StepId =
    | "welcome"
    | "profile"
    | "contacts"
    | "vehicle"
    | "tag"
    | "finish";

export type StepConfig = {
    id: StepId;
    icon: string;
    title: string;
    subtitle: string;
    /** Can the person skip this step? */
    skippable: boolean;
};

export const STEPS: StepConfig[] = [
    {
        id: "welcome",
        icon: "👋",
        title: "Welcome to SafeLink",
        subtitle: "Let's get you ready in a few quick steps.",
        skippable: false,
    },
    {
        id: "profile",
        icon: "🪪",
        title: "About you",
        subtitle: "What should a responder know first?",
        skippable: true,
    },
    {
        id: "contacts",
        icon: "📞",
        title: "Emergency contacts",
        subtitle: "People who can be called for you.",
        skippable: true,
    },
    {
        id: "vehicle",
        icon: "🚗",
        title: "Vehicle & tracker",
        subtitle: "Helps with recovery. Totally optional.",
        skippable: true,
    },
    {
        id: "tag",
        icon: "🏷️",
        title: "Claim your tag",
        subtitle: "Use the details supplied with your SafeLink tag.",
        skippable: true,
    },
    {
        id: "finish",
        icon: "🚀",
        title: "Almost there",
        subtitle: "Review your setup, then add your card to start your free trial.",
        skippable: false,
    },
];

/**
 * Monthly price in rand, used ONLY to display prepaid prices on the finish
 * slide. The backend signs the real amount (SUBSCRIPTION_MONTHLY_AMOUNT), so
 * keep this in step with that setting.
 */
export const PLAN_MONTHLY_ZAR = 19.99;

/** Lengths of prepaid access the backend accepts. */
export const PREPAID_MONTHS = [1, 3, 12] as const;

/**
 * "Save whatever is typed in" hook-up between a slide and the wizard.
 *
 * A slide with an add-form (contacts, vehicle) gives the wizard a function.
 * Before the wizard leaves the slide (Continue, Back, the progress dots,
 * Save & exit) it calls it, so details that were typed but never added with the
 * form's own button are SAVED instead of silently lost.
 *
 * The function resolves to true when it is fine to leave (nothing typed, or it
 * saved), and false when the person must stay (for example a name is missing).
 */
export type FlushPending = () => Promise<boolean>;
export type RegisterFlush = (flush: FlushPending | null) => void;