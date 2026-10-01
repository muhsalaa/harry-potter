import assert from "node:assert/strict";
import { test } from "node:test";

import { getTableColumns, getTableName } from "drizzle-orm";

import { appliedMigrations } from "../src/infrastructure/d1/database.ts";
import * as schema from "../src/infrastructure/d1/schema.ts";
import { makeWorld } from "./harness.ts";

/** What `PRAGMA table_info` says a table is made of. */
type ColumnInfo = { name: string; notnull: number };

const columnsOf = async (d1: D1Database, table: string): Promise<ColumnInfo[]> => {
  const { results } = await d1.prepare(`PRAGMA table_info(${table})`).all();

  return results.map((row) => ({ name: String(row.name), notnull: Number(row.notnull) }));
};

test("the migrations land in a fresh database, and the ledger says which", async () => {
  const { db, d1 } = await makeWorld();

  assert.deepEqual(
    (await appliedMigrations(db)).map((row) => row.name),
    [
      "001-users-and-sessions.sql",
      "002-characters.sql",
      "003-favorites.sql",
      "004-notes.sql",
      "005-page-size-16.sql",
    ],
  );

  const { results } = await d1
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all();

  assert.deepEqual(
    results
      .map((row) => String(row.name))
      // SQLite keeps its own tables too: miniflare's metadata, and the
      // AUTOINCREMENT counter behind wrangler's ledger.
      .filter((name) => !name.startsWith("_cf_") && name !== "sqlite_sequence"),
    ["characters", "corpus", "d1_migrations", "favorites", "notes", "sessions", "users"],
  );
});

test("the drizzle schema names exactly the columns the migrations create", async () => {
  const { d1 } = await makeWorld();

  for (const table of Object.values(schema)) {
    const name = getTableName(table);
    const described = Object.entries(getTableColumns(table)).map(([property, column]) => {
      assert.equal(property, column.name, `${name}.${property} is keyed differently from its column`);
      return column;
    });
    const created = await columnsOf(d1, name);

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
