import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import { migrate } from "./migrate.js";

const here = dirname(fileURLToPath(import.meta.url));

export const MIGRATIONS_DIR = join(here, "..", "migrations");
export const DB_PATH =
  process.env.DATABASE_PATH ?? join(here, "..", "data", "portal.db");

export function openDatabase(path = DB_PATH) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function migrateDatabase(db) {
  return migrate(db, MIGRATIONS_DIR);
}
