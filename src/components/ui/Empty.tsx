/**
 * components/ui/Empty.tsx
 * ---------------------------------------------------------------------------
 * Placeholder shown when a list has no items yet
 * (e.g. "No contacts added yet.").
 */
type EmptyProps = {
  text: string;
};

export function Empty({ text }: EmptyProps) {
  return (
    <div className="empty-state">
      <span>◌</span>
      <p>{text}</p>
    </div>
  );
}
