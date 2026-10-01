import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import type { MigrationRecord } from "../../domain/model.ts";
import { migrate } from "./migrate.ts";

const here = dirname(fileURLToPath(import.meta.url));

export const MIGRATIONS_DIR = join(here, "..", "..", "..", "migrations");
export const DB_PATH = process.env.DATABASE_PATH ?? join(here, "..", "..", "..", "data", "portal.db");

export type Db = Database.Database;

export function openDatabase(path: string = DB_PATH): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function migrateDatabase(db: Db, dir: string = MIGRATIONS_DIR): string[] {
  return migrate(db, dir);
}

export function appliedMigrations(db: Db): MigrationRecord[] {
  return db
    .prepare("SELECT name, applied_at AS appliedAt FROM schema_migrations ORDER BY name")
    .all() as MigrationRecord[];
}
