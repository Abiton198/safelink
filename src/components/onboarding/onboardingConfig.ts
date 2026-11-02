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