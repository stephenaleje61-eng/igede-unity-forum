/**
 * Client-side Action Rate Limiter
 * Guards Firestore writes from spam, rapid-clicks, and accidental double-submits.
 */

export class RateLimiter {
  private static timestamps = new Map<string, number>();

  /**
   * Checks if an action is allowed for a user.
   * If allowed, updates the timestamp and returns { allowed: true }.
   * If throttled, returns { allowed: false, waitSeconds }.
   */
  static check(actionKey: string, cooldownMs: number): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const last = this.timestamps.get(actionKey) || 0;
    const elapsed = now - last;

    if (elapsed < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { allowed: false, waitSeconds };
    }

    this.timestamps.set(actionKey, now);
    return { allowed: true };
  }

  /**
   * Reset cooldown for a given actionKey (e.g., if a write failed and user should be allowed to retry immediately)
   */
  static reset(actionKey: string): void {
    this.timestamps.delete(actionKey);
  }
}
