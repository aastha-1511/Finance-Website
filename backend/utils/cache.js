/**
 * cache.js — Redis-backed cache with silent in-memory fallback
 * If Redis is not running, falls back to Map-based in-memory cache — no errors logged.
 */

import Redis from 'ioredis';

let redis = null;
let useRedis = false;

// ── Try to connect to Redis — swallow ALL errors silently ─────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

redis = new Redis(redisUrl, {
    lazyConnect: true,
    connectTimeout: 1500,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,   // never retry — fail fast and quietly
});

// must attach error handler BEFORE connect() to prevent unhandled-error crash
redis.on('error', () => { useRedis = false; });

try {
    await redis.connect();
    // quick ping to verify
    await redis.ping();
    useRedis = true;
    console.log('✅ Redis connected — caching enabled');
} catch {
    console.log('ℹ️  Redis not available — using in-memory cache');
    useRedis = false;
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const memCache = new Map();

const memGet = (key) => {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
    return entry.value;
};

const memSet = (key, value, ttlSeconds) =>
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

// ── Public API ────────────────────────────────────────────────────────────────
export const cacheGet = async (key) => {
    if (useRedis) {
        try { const raw = await redis.get(key); return raw ? JSON.parse(raw) : null; }
        catch { /* fall through */ }
    }
    return memGet(key);
};

export const cacheSet = async (key, value, ttlSeconds = 15) => {
    if (useRedis) {
        try { await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); return; }
        catch { /* fall through */ }
    }
    memSet(key, value, ttlSeconds);
};

export const cacheDel = async (key) => {
    if (useRedis) { try { await redis.del(key); } catch { } }
    memCache.delete(key);
};
