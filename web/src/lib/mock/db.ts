import { formatDate, toDateInputValue } from "@/lib/format";

/** Deterministic-ish pseudo random generator seeded by a string, for stable mock data. */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // xorshift-ish scramble
  let x = h >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 10000) / 10000;
}

export function pick<T>(items: readonly T[], seed: string): T {
  return items[Math.floor(seededRandom(seed) * items.length)];
}

export function slugId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

/**
 * Mock repository: an in-browser, localStorage-backed database.
 * This mirrors the shape the real API (SQLite locally -> Supabase in production)
 * will expose, so pages can be written against `services/*` and swapped later.
 */

const STORAGE_KEY = "klinik-gigi:db:v1";
// FIX: dinaikkan dari 1 ke 2 supaya data lama di localStorage di-seed ulang.
export const SEED_VERSION = 2;

export interface DatabaseShape {
  seedVersion: number;
  clinicId: string;
  clinics: unknown[];
  profiles: unknown[];
  patients: unknown[];
  appointments: unknown[];
  visits: unknown[];
  treatments: unknown[];
  visitTreatments: unknown[];
  payments: unknown[];
  auditLogs: unknown[];
  counters: Record<string, number>;
}

let memoryFallback: string | null = null;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__kg_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRawDb(): string | null {
  const store = storage();
  if (!store) return memoryFallback;
  return store.getItem(STORAGE_KEY);
}

export function writeRawDb(value: string): void {
  memoryFallback = value;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, value);
  } catch {
    /* quota exceeded — keep working from memory */
  }
}

export function clearRawDb(): void {
  memoryFallback = null;
  storage()?.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Number generators per PRD:
 *   patient  -> P-000001
 *   visit    -> VIS-20261009-0001
 *   payment  -> PAY-20261009-0001
 */
export function formatPatientNumber(counter: number): string {
  return `P-${String(counter).padStart(6, "0")}`;
}

export function formatVisitNumber(counter: number, date = new Date()): string {
  return `VIS-${toDateInputValue(date)}-${String(counter).padStart(4, "0")}`;
}

export function formatPaymentNumber(counter: number, date = new Date()): string {
  return `PAY-${toDateInputValue(date)}-${String(counter).padStart(4, "0")}`;
}

/** Next daily counter for a given prefix, based on existing records. */
export function nextDailyCounter(
  existing: { date: string; number: string }[],
  prefix: string,
  date = new Date(),
): number {
  void prefix;
  const target = toDateInputValue(date);
  const sameDay = existing.filter((item) => item.date === target);
  if (sameDay.length === 0) return 1;
  return (
    sameDay.reduce((max, item) => {
      const suffix = Number.parseInt(item.number.split("-").pop() ?? "0", 10);
      return Number.isNaN(suffix) ? max : Math.max(max, suffix);
    }, 0) + 1
  );
}

export function todayInput(): string {
  return toDateInputValue(new Date());
}

export function visitDateLabel(date: string): string {
  return formatDate(date);
}