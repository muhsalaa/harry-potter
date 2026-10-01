import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { openDatabase } from "../src/infrastructure/sqlite/database.ts";
import type { Db } from "../src/infrastructure/sqlite/database.ts";
import { migrate } from "../src/infrastructure/sqlite/migrate.ts";

function migrationsDir() {
  const dir = mkdtempSync(join(tmpdir(), "portal-migrations-"));
  // written out of order on purpose — the runner must sort by filename
  writeFileSync(join(dir, "002-second.sql"), "CREATE TABLE second (id INTEGER PRIMARY KEY);");
  writeFileSync(join(dir, "001-first.sql"), "CREATE TABLE first (id INTEGER PRIMARY KEY);");
  return dir;
}

const count = (db: Db, sql: string): number => (db.prepare(sql).get() as { c: number }).c;

test("applies migrations in filename order, once each", () => {
  const db = openDatabase(":memory:");
  const dir = migrationsDir();

  assert.deepEqual(migrate(db, dir), ["001-first.sql", "002-second.sql"]);
  assert.deepEqual(migrate(db, dir), [], "second run applies nothing");

  assert.equal(count(db, "SELECT count(*) AS c FROM schema_migrations"), 2);
  assert.equal(count(db, "SELECT count(*) AS c FROM first"), 0);
});

test("a failing migration leaves no table and no record", () => {
  const db = openDatabase(":memory:");
  const dir = migrationsDir();
  migrate(db, dir);

  writeFileSync(join(dir, "003-broken.sql"), "CREATE TABLE half_done (id INTEGER); THIS IS NOT SQL;");

  assert.throws(() => migrate(db, dir));
  assert.equal(count(db, "SELECT count(*) AS c FROM schema_migrations"), 2);
  assert.equal(count(db, "SELECT count(*) AS c FROM sqlite_master WHERE name = 'half_done'"), 0, "the partial migration was rolled back");
});

test("a missing migrations directory is not a crash", () => {
  const db = openDatabase(":memory:");
  assert.deepEqual(migrate(db, join(tmpdir(), "portal-no-such-dir")), []);
  assert.equal(count(db, "SELECT count(*) AS c FROM schema_migrations"), 0);
});
