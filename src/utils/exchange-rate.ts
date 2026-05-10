import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const CACHE_FILE = join(homedir(), ".token-receipts", "exchange-rate-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RATE = 7.25;

interface CacheEntry {
  rate: number;
  fetchedAt: string;
}

export async function getUsdCnyRate(): Promise<number> {
  // Try cache first
  const cached = await readCache();
  if (cached) return cached;

  // Fetch from API
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=CNY",
      { signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) {
      const data = (await res.json()) as { rates: { CNY: number } };
      const rate = data.rates.CNY;
      await writeCache(rate);
      return rate;
    }
  } catch {
    // Network error or timeout — use fallback
  }

  return FALLBACK_RATE;
}

async function readCache(): Promise<number | null> {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = await readFile(CACHE_FILE, "utf-8");
    const entry: CacheEntry = JSON.parse(raw);
    const age = Date.now() - new Date(entry.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) return entry.rate;
  } catch {
    // Corrupted cache — ignore
  }
  return null;
}

async function writeCache(rate: number): Promise<void> {
  try {
    const dir = join(homedir(), ".token-receipts");
    await mkdir(dir, { recursive: true });
    const entry: CacheEntry = { rate, fetchedAt: new Date().toISOString() };
    await writeFile(CACHE_FILE, JSON.stringify(entry), "utf-8");
  } catch {
    // Can't write cache — non-critical
  }
}
