/**
 * components/onboarding/StepTag.tsx
 * ---------------------------------------------------------------------------
 * Slide 5: claim the physical tag by SCANNING it.
 *
 * No reference or activation code to type: the person scans the QR code on the
 * tag, its details fill in automatically and are linked to their account, and
 * they confirm to finish. All of that is in components/tags/TagClaimFlow.tsx;
 * this slide just lists the tags already claimed and refreshes the wizard's
 * data after a new claim.
 */
import type { OnboardingApi } from "../../hooks/useOnboarding";
import { TagClaimFlow } from "../tags/TagClaimFlow";

export function StepTag({ ob }: { ob: OnboardingApi }) {
    return (
        <>
            {ob.tags.length > 0 && (
                <ul className="ob-chips" aria-label="Claimed tags">
                    {ob.tags.map((tag) => (
                        <li key={tag.qr_id} className="ob-chip">
                            <span>
                                <strong>{tag.label}</strong>
                                <small>{tag.active ? "Active" : "Deactivated"}</small>
                            </span>
                            <span aria-hidden="true">{tag.active ? "✅" : "⏸"}</span>
                        </li>
                    ))}
                </ul>
            )}

            <TagClaimFlow
                onClaimed={() => void ob.refresh()}
                scanLabel={ob.tags.length > 0 ? "📷 Scan another tag" : "📷 Scan your tag"}
            />

            <p className="ob-hint">
                Don't have your tag yet? Skip this step and claim it later.
            </p>
        </>
    );
}