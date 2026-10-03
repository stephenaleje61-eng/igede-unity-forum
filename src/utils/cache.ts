/**
 * In-Memory TTL Cache for scalable, high-performance read optimization
 * Prevents redundant Firestore reads across 1M user scale.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class MemoryCache {
  private static store = new Map<string, CacheEntry<any>>();

  /**
   * Set value in cache with a Time-To-Live in milliseconds (default 5 minutes)
   */
  static set<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
    // Prevent memory leaks: evict oldest if cache exceeds 1,500 entries
    if (this.store.size > 1500) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      data: value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Get value from cache if still valid
   */
  static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Invalidate specific key or prefix
   */
  static invalidate(keyOrPrefix: string): void {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.store.clear();
  }
}
