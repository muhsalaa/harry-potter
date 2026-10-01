import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { sql } from "drizzle-orm";

import type { Db } from "./database.ts";
import { schemaMigrations } from "./schema.ts";

/**
 * Applies every *.sql file in `dir` that has not been applied yet, in filename
 * order, each inside its own transaction. Returns the names it applied this run.
 */
export function migrate(db: Db, dir: string): string[] {
  // A migration file holds several statements, which drizzle does not prepare;
  // the driver's `exec` does. Same connection, so it joins the transaction below.
  const raw = db.$client;

  db.run(sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  let files: string[] = [];
  try {
    files = readdirSync(dir)
      .filter((name) => name.endsWith(".sql"))
      .sort();
  } catch {
    return []; // no migrations directory yet — nothing to do
  }

  const applied = new Set(
    db
      .select({ name: schemaMigrations.name })
      .from(schemaMigrations)
      .all()
      .map((row) => row.name),
  );
  const ran: string[] = [];

  for (const name of files) {
    if (applied.has(name)) continue;

    db.transaction((tx) => {
      raw.exec(readFileSync(join(dir, name), "utf8"));
      tx.insert(schemaMigrations).values({ name }).run();
    });

    ran.push(name);
  }

  return ran;
}
