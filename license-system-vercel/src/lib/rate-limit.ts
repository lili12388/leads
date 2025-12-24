import { db, generateId } from './db';

// ===========================================
// RATE LIMITER CONFIGURATION
// ===========================================

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

const RATE_LIMITS = {
  activate: { requests: 5, windowSeconds: 60 },
  validate: { requests: 30, windowSeconds: 60 },
  admin: { requests: 100, windowSeconds: 60 },
};

export async function checkRateLimit(
  identifier: string,
  endpoint: 'activate' | 'validate' | 'admin'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];
  const key = `${endpoint}:${identifier}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);

  try {
    // Clean old entries
    await db.execute({
      sql: `DELETE FROM rate_limits WHERE datetime(window_start) < datetime(?)`,
      args: [windowStart.toISOString()],
    });

    // Get current entry
    const result = await db.execute({
      sql: `SELECT * FROM rate_limits WHERE key = ?`,
      args: [key],
    });

    if (result.rows.length === 0) {
      // Create new entry
      await db.execute({
        sql: `INSERT INTO rate_limits (id, key, count, window_start) VALUES (?, ?, 1, ?)`,
        args: [generateId(), key, now.toISOString()],
      });
      return {
        allowed: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset: Math.floor(now.getTime() / 1000) + config.windowSeconds,
        retryAfter: 0,
      };
    }

    const entry = result.rows[0];
    const entryWindowStart = new Date(entry.window_start as string);
    const count = entry.count as number;

    // Check if window has expired
    if (entryWindowStart < windowStart) {
      await db.execute({
        sql: `UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?`,
        args: [now.toISOString(), key],
      });
      return {
        allowed: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset: Math.floor(now.getTime() / 1000) + config.windowSeconds,
        retryAfter: 0,
      };
    }

    // Increment count
    const newCount = count + 1;
    await db.execute({
      sql: `UPDATE rate_limits SET count = ? WHERE key = ?`,
      args: [newCount, key],
    });

    const allowed = newCount <= config.requests;
    const reset = Math.floor(entryWindowStart.getTime() / 1000) + config.windowSeconds;

    return {
      allowed,
      limit: config.requests,
      remaining: Math.max(0, config.requests - newCount),
      reset,
      retryAfter: allowed ? 0 : Math.max(0, reset - Math.floor(now.getTime() / 1000)),
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open
    return {
      allowed: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Math.floor(now.getTime() / 1000) + config.windowSeconds,
      retryAfter: 0,
    };
  }
}
