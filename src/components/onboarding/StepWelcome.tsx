/**
 * components/onboarding/StepWelcome.tsx
 * ---------------------------------------------------------------------------
 * Slide 1: a friendly overview of what is coming. No form, nothing to save.
 */
export function StepWelcome() {
    const items = [
        ["🪪", "Your details", "Name and what responders should know"],
        ["📞", "Trusted contacts", "Who can be called for you"],
        ["🚗", "Vehicle (optional)", "Helps with recovery"],
        ["🏷️", "Your SafeLink tag", "Claim it with the code supplied"],
    ];

    return (
        <>
            <ul className="ob-list">
                {items.map(([icon, title, text]) => (
                    <li key={title}>
                        <span className="ob-list-icon">{icon}</span>
                        <span>
                            <strong>{title}</strong>
                            <small>{text}</small>
                        </span>
                    </li>
                ))}
            </ul>

            <p className="ob-hint">
                ⏱ About 3 minutes. You can <strong>skip any step</strong>, go back, or
                choose <strong>Save &amp; exit</strong> and continue later. Anything
                you save is kept.
            </p>
        </>
    );
}