// ---------------------------------------------------------------------------
// In-memory TTL cache for user context
// ---------------------------------------------------------------------------
// Works within warm serverless instances. Cache misses gracefully fall through
// to DB queries. For Vercel, this helps with rapid-fire chat messages within
// the same lambda invocation.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Periodic cleanup to prevent memory leaks (every 60s)
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key);
    }
    // Stop timer if cache is empty
    if (cache.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, 60_000);
  // Allow process to exit even if timer is running
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  ensureCleanup();
}

export function cacheDelete(...keys: string[]): void {
  for (const key of keys) cache.delete(key);
}

export function cacheDeletePattern(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Cache key builders
// ---------------------------------------------------------------------------

function today(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  return d.toISOString().split("T")[0];
}

export const CACHE_KEYS = {
  fullContext: (uid: string) => `ctx:${uid}:full`,
  userProfile: (uid: string) => `ctx:${uid}:profile`,
  todayMeals: (uid: string) => `ctx:${uid}:meals:${today()}`,
  todayWater: (uid: string) => `ctx:${uid}:water:${today()}`,
  todayWorkouts: (uid: string) => `ctx:${uid}:workouts:${today()}`,
  dayStatus: (uid: string) => `ctx:${uid}:daystatus:${today()}`,
};

// TTLs in milliseconds
export const CACHE_TTLS = {
  fullContext: 60_000,     // 60s — assembled context
  userProfile: 300_000,   // 5min — profile rarely changes
  todayMeals: 120_000,    // 2min — changes after meal log
  todayWater: 120_000,    // 2min — changes after water log
  todayWorkouts: 120_000, // 2min — changes after workout
  dayStatus: 30_000,      // 30s — day summary
};

// ---------------------------------------------------------------------------
// Invalidation helpers — call after DB writes
// ---------------------------------------------------------------------------

export function invalidateAfterMealLog(userId: string): void {
  cacheDelete(
    CACHE_KEYS.fullContext(userId),
    CACHE_KEYS.todayMeals(userId),
    CACHE_KEYS.dayStatus(userId)
  );
}

export function invalidateAfterWorkoutLog(userId: string): void {
  cacheDelete(
    CACHE_KEYS.fullContext(userId),
    CACHE_KEYS.todayWorkouts(userId),
    CACHE_KEYS.dayStatus(userId)
  );
}

export function invalidateAfterWaterLog(userId: string): void {
  cacheDelete(
    CACHE_KEYS.fullContext(userId),
    CACHE_KEYS.todayWater(userId),
    CACHE_KEYS.dayStatus(userId)
  );
}

export function invalidateAfterWeightLog(userId: string): void {
  cacheDelete(
    CACHE_KEYS.fullContext(userId),
    CACHE_KEYS.userProfile(userId)
  );
}

export function invalidateAll(userId: string): void {
  cacheDeletePattern(`ctx:${userId}:`);
}
