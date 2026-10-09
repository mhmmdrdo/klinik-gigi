import { clearRawDb, generateId, nowIso, readRawDb, SEED_VERSION } from "./db";
import { buildSeedDatabase, DEFAULT_CLINIC_ID, persistDb, type Db } from "./seed";

let cache: Db | null = null;

/** Reads the local database, seeding it on first run. */
export function getDb(): Db {
  if (cache) return cache;

  const raw = readRawDb();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.seedVersion === SEED_VERSION) {
        cache = parsed;
        return parsed;
      }
    } catch {
      // corrupted storage -> reseed
    }
  }

  const seeded = buildSeedDatabase();
  persistDb(seeded);
  cache = seeded;
  return seeded;
}

export function mutateDb<T>(mutator: (db: Db) => T): T {
  const db = getDb();
  const result = mutator(db);
  persistDb(db);
  return result;
}

/** Wipes local data and reseeds the demo dataset. */
export function resetDb(): void {
  clearRawDb();
  cache = null;
  getDb();
}

export function currentClinicId(): string {
  return getDb().clinicId ?? DEFAULT_CLINIC_ID;
}

/** Simulates network latency so loading states are exercised in the frontend phase. */
export function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function createAuditLog(
  db: Db,
  user: { id: string; fullName: string },
  action: import("@/types").AuditAction,
  entityType: string,
  entityId: string,
  description: string,
): void {
  db.auditLogs.unshift({
    id: generateId(),
    clinicId: db.clinicId,
    userId: user.id,
    userName: user.fullName,
    action,
    entityType,
    entityId,
    description,
    createdAt: nowIso(),
  });
  // Keep the log bounded.
  if (db.auditLogs.length > 200) db.auditLogs.length = 200;
}