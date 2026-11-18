/**
 * For notifications to main that nothing in the page depends on (menu context, close guard, ready, log lines).
 * A failure is reported to the console and never breaks navigation.
 */
export function fire(call: () => Promise<unknown>, what: string): void {
  try {
    call().catch((e: unknown) => console.warn(`${what} failed:`, e));
  } catch (e) {
    console.warn(`${what} failed:`, e);
  }
}
