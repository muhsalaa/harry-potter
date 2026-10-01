import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Db } from "./database.ts";

/**
 * Applies every *.sql file in `dir` that has not been applied yet, in filename
 * order, each inside its own transaction. Returns the names it applied this run.
 */
export function migrate(db: Db, dir: string): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
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
    (db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[]).map(
      (row) => row.name,
    ),
  );
  const record = db.prepare("INSERT INTO schema_migrations (name) VALUES (?)");
  const ran: string[] = [];

  for (const name of files) {
    if (applied.has(name)) continue;

    db.transaction(() => {
      db.exec(readFileSync(join(dir, name), "utf8"));
      record.run(name);
    })();

    ran.push(name);
  }

  return ran;
}
