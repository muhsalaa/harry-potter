import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { getTableColumns, getTableName } from "drizzle-orm";

import { migrateDatabase, openDatabase } from "../src/infrastructure/sqlite/database.ts";
import type { Db } from "../src/infrastructure/sqlite/database.ts";
import { migrate } from "../src/infrastructure/sqlite/migrate.ts";
import * as schema from "../src/infrastructure/sqlite/schema.ts";

function migrationsDir() {
  const dir = mkdtempSync(join(tmpdir(), "portal-migrations-"));
  // written out of order on purpose — the runner must sort by filename
  writeFileSync(join(dir, "002-second.sql"), "CREATE TABLE second (id INTEGER PRIMARY KEY);");
  writeFileSync(join(dir, "001-first.sql"), "CREATE TABLE first (id INTEGER PRIMARY KEY);");
  return dir;
}

const count = (db: Db, sql: string): number => db.get<{ c: number }>(sql)?.c ?? 0;

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

/** What `PRAGMA table_info` says a table is made of. */
type ColumnInfo = { name: string; notnull: number };

test("the drizzle schema names exactly the columns the migrations create", () => {
  const db = openDatabase(":memory:");
  migrateDatabase(db);

  for (const table of Object.values(schema)) {
    const name = getTableName(table);
    const described = Object.entries(getTableColumns(table)).map(([property, column]) => {
      assert.equal(property, column.name, `${name}.${property} is keyed differently from its column`);
      return column;
    });
    const created = db.all<ColumnInfo>(`PRAGMA table_info(${name})`);

    assert.deepEqual(
      described.map((column) => column.name).sort(),
      created.map((column) => column.name).sort(),
      `${name} has drifted from its migration`,
    );

    for (const column of created) {
      const known = described.find((candidate) => candidate.name === column.name)!;
      // SQLite does not flag an `INTEGER PRIMARY KEY` NOT NULL; drizzle does.
      if (known.primary) continue;

      assert.equal(known.notNull, column.notnull === 1, `${name}.${column.name} nullability has drifted`);
    }
  }
});
