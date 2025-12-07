/**
 * Simple but powerful caching utility
 * Supports both in-memory (fast) and localStorage (persistent) caching
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class CacheManager {
    private memoryCache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Get cached data
     * @param key Cache key
     * @param options.useMemory Use in-memory cache (faster)
     * @param options.usePersistent Use localStorage (survives page refresh)
     */
    get<T>(key: string, options: { useMemory?: boolean; usePersistent?: boolean } = {}): T | null {
        const { useMemory = true, usePersistent = true } = options;

        // Try memory cache first (fastest)
        if (useMemory) {
            const memEntry = this.memoryCache.get(key);
            if (memEntry && Date.now() < memEntry.expiresAt) {
                return memEntry.data as T;
            }
        }

        // Try localStorage (survives refresh)
        if (usePersistent) {
            try {
                const stored = localStorage.getItem(`cache:${key}`);
                if (stored) {
                    const entry: CacheEntry<T> = JSON.parse(stored);
                    if (Date.now() < entry.expiresAt) {
                        // Restore to memory cache
                        if (useMemory) {
                            this.memoryCache.set(key, entry);
                        }
                        return entry.data;
                    } else {
                        // Expired, remove it
                        localStorage.removeItem(`cache:${key}`);
                    }
                }
            } catch (e) {
                // Invalid JSON, ignore
            }
        }

        return null;
    }

    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param options.ttl Time to live in milliseconds
     * @param options.useMemory Store in memory
     * @param options.usePersistent Store in localStorage
     */
    set<T>(
        key: string,
        data: T,
        options: { ttl?: number; useMemory?: boolean; usePersistent?: boolean } = {}
    ): void {
        const { ttl = this.DEFAULT_TTL, useMemory = true, usePersistent = true } = options;
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
        };

        if (useMemory) {
            this.memoryCache.set(key, entry);
        }

        if (usePersistent) {
            try {
                localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
            } catch (e) {
                // localStorage full or disabled, ignore
            }
        }
    }

    /**
     * Invalidate (delete) cached data
     */
    invalidate(key: string): void {
        this.memoryCache.delete(key);
        localStorage.removeItem(`cache:${key}`);
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.memoryCache.clear();
        // Clear all cache: prefixed items
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('cache:')) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Get or fetch pattern - cache-aside
     */
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: { ttl?: number; useMemory?: boolean; usePersistent?: boolean } = {}
    ): Promise<T> {
        const cached = this.get<T>(key, options);
        if (cached !== null) {
            return cached;
        }

        const data = await fetcher();
        this.set(key, data, options);
        return data;
    }
}

export const cache = new CacheManager();
