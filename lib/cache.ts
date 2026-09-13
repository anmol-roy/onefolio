// ─── shared in-process cache with stale-while-revalidate ─────────────────────
//
// why module-level?  Next.js route handlers share the same Node process on the
// server, so a module-level Map acts as a lightweight shared cache without
// needing Redis or any external dependency.
//
// stale-while-revalidate: if data is older than TTL but younger than STALE_MAX
// we return the stale data immediately and kick off a background refresh.
// this means users always get a fast response even when the upstream is slow.

export type CacheEntry<T> = {
  data: T;
  cachedAt: number;        // unix ms — when this entry was written
  fetchDurationMs: number; // how long the upstream fetch took
};

type CacheOptions = {
  ttlMs: number;     // data is fresh for this long
  staleMs: number;   // data is acceptable (stale) until this long after ttl
};

const DEFAULT_OPTS: CacheOptions = {
  ttlMs:   15_000,   // 15 seconds fresh window
  staleMs: 60_000,   // up to 60 seconds stale-while-revalidate window
};

export class Cache<T> {
  private entry: CacheEntry<T> | null = null;
  private revalidating = false;
  private opts: CacheOptions;

  constructor(opts: Partial<CacheOptions> = {}) {
    this.opts = { ...DEFAULT_OPTS, ...opts };
  }

  // returns the cached entry if still fresh
  getFresh(): CacheEntry<T> | null {
    if (!this.entry) return null;
    const age = Date.now() - this.entry.cachedAt;
    return age < this.opts.ttlMs ? this.entry : null;
  }

  // returns stale data if within the stale window — used for SWR
  getStale(): CacheEntry<T> | null {
    if (!this.entry) return null;
    const age = Date.now() - this.entry.cachedAt;
    return age < this.opts.ttlMs + this.opts.staleMs ? this.entry : null;
  }

  set(data: T, fetchDurationMs: number) {
    this.entry = { data, cachedAt: Date.now(), fetchDurationMs };
  }

  invalidate() {
    this.entry = null;
  }

  get isRevalidating() { return this.revalidating; }
  setRevalidating(v: boolean) { this.revalidating = v; }

  get ageMs(): number {
    return this.entry ? Date.now() - this.entry.cachedAt : -1;
  }
}
