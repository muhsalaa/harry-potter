import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import type { MigrationRecord } from "../../domain/model.ts";
import * as schema from "./schema.ts";
import { d1Migrations } from "./schema.ts";

/**
 * D1 is the only database now: the binding arrives per request, and the driver
 * is drizzle's — nothing here names SQLite or opens a file.
 */
export type Db = DrizzleD1Database<typeof schema>;

export const openDatabase = (d1: D1Database): Db => drizzle(d1, { schema });

/** What wrangler's ledger says has been applied — the health report's own view. */
export function appliedMigrations(db: Db): Promise<MigrationRecord[]> {
  return db
    // Only wrangler writes here, and always with a name — its column just does not say so.
    .select({ name: sql<string>`${d1Migrations.name}`, appliedAt: d1Migrations.applied_at })
    .from(d1Migrations)
    .orderBy(d1Migrations.name)
    .all();
}
