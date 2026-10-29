/**
 * utils/messageOf.ts
 * ---------------------------------------------------------------------------
 * Turns anything that was thrown (`catch (err)`) into a message that is safe
 * to show to a user.
 *
 * In TypeScript a caught value is `unknown`, so we check that it is a real
 * Error before reading `.message`. Otherwise we show a friendly fallback.
 */
export function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
