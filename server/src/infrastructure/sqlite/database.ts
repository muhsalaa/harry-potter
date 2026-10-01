import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type { MigrationRecord } from "../../domain/model.ts";
import { migrate } from "./migrate.ts";
import * as schema from "./schema.ts";
import { schemaMigrations } from "./schema.ts";

const here = dirname(fileURLToPath(import.meta.url));

export const MIGRATIONS_DIR = join(here, "..", "..", "..", "migrations");
export const DB_PATH = process.env.DATABASE_PATH ?? join(here, "..", "..", "..", "data", "portal.db");

/**
 * Drizzle over the driver, which stays reachable as `$client`: a migration
 * file is several statements at once and only the driver's own `exec` runs
 * those. Nothing else should need it — the stores speak drizzle.
 */
export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export function openDatabase(path: string = DB_PATH): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

  const client = new Database(path);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");

  return drizzle(client, { schema });
}

export function migrateDatabase(db: Db, dir: string = MIGRATIONS_DIR): string[] {
  return migrate(db, dir);
}

export function appliedMigrations(db: Db): MigrationRecord[] {
  return db
    .select({ name: schemaMigrations.name, appliedAt: schemaMigrations.applied_at })
    .from(schemaMigrations)
    .orderBy(schemaMigrations.name)
    .all();
}
