type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
let lastSweepAt = 0;

function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  sweepExpired(now);

  const bucketKey = `${options.keyPrefix || 'default'}:${key || 'unknown'}`;
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return {
      ok: true,
      limit: options.max,
      remaining: Math.max(options.max - 1, 0),
      resetAt
    };
  }

  current.count += 1;
  return {
    ok: current.count <= options.max,
    limit: options.max,
    remaining: Math.max(options.max - current.count, 0),
    resetAt: current.resetAt
  };
}

function sweepExpired(now = Date.now()) {
  if (now - lastSweepAt < 60_000) return;
  lastSweepAt = now;
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

function rateLimitStats() {
  sweepExpired();
  return { buckets: buckets.size };
}

export { checkRateLimit, rateLimitStats };
