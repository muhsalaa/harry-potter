import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after } from "node:test";
import { fileURLToPath } from "node:url";

import { getPlatformProxy, unstable_splitSqlQuery } from "wrangler";

import type { Catalog, CatalogPage, CharacterStore, PersonalStore } from "../src/application/ports.ts";
import { createServices } from "../src/application/services.ts";
import type { Services } from "../src/application/services.ts";
import { createAuth } from "../src/auth.ts";
import type { Auth } from "../src/auth.ts";
import type { Character } from "../src/domain/character.ts";
import { AppError } from "../src/domain/errors.ts";
import type { ErrorKind } from "../src/domain/errors.ts";
import type { User } from "../src/domain/model.ts";
import { createCharacterStore } from "../src/infrastructure/d1/character-store.ts";
import { appliedMigrations, openDatabase } from "../src/infrastructure/d1/database.ts";
import type { Db } from "../src/infrastructure/d1/database.ts";
import { createPersonalStore } from "../src/infrastructure/d1/personal-store.ts";

const here = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(here, "..", "..", "wrangler.jsonc");
const MIGRATIONS = join(here, "..", "migrations");

const PASSWORD = "expelliarmus42";
const SECRET = "a-test-secret-long-enough-for-better-auth-to-accept-it";

/** The bindings wrangler.jsonc declares, as a test sees them. */
type Bindings = { DB: D1Database; ASSETS: Fetcher };

/** The bindings a test world is given: no secrets from files, no network. */
type TestEnv = Pick<Env, "DB" | "ASSETS" | "POTTERDB_BASE_URL"> & { BETTER_AUTH_SECRET: string };

/** Where a test's requests are addressed to, and so the origin auth derives. */
type WorldOptions = { origin?: string };

/**
 * One local runtime per test *file*, not per test. Booting workerd costs more
 * than everything a world does to it, and a dozen of them at once is how a test
 * run brings a laptop to its knees. Each world still starts from an empty
 * schema: `reset` clears the rows.
 */
let runtime: Promise<{ env: Bindings; dispose(): Promise<void> }> | undefined;

const platform = () =>
  (runtime ??= getPlatformProxy<Bindings>({ configPath: CONFIG, persist: false }));

after(async () => {
  const started = await runtime?.catch(() => undefined);
  await started?.dispose();
});

export const character = (over: Partial<Character> = {}): Character => ({
  potterdbId: "11111111-1111-1111-1111-111111111111",
  slug: "harry-potter",
  name: "Harry Potter",
  house: "Gryffindor",
  aliasNames: ["The Boy Who Lived"],
  ...over,
});

/** PotterDB, faked: the one dependency a test cannot run locally. */
export function fakeCatalog(corpus: Character[][]): Catalog & { fetches: number } {
  const catalog = {
    fetches: 0,

    async page(page: number): Promise<CatalogPage> {
      catalog.fetches += 1;

      return {
        characters: corpus[page - 1] ?? [],
        records: corpus.flat().length,
        pages: corpus.length,
        page,
      };
    },

    async bySlug(slug: string): Promise<Character | null> {
      catalog.fetches += 1;
      return corpus.flat().find((entry) => entry.slug === slug) ?? null;
    },
  };

  return catalog;
}

export type World = {
  /** The drizzle handle the stores use, the D1 binding, and Better Auth itself. */
  db: Db;
  d1: D1Database;
  env: TestEnv;
  auth: Auth;
  services: Services;
  catalog: Catalog & { fetches: number };
  stores: { characters: CharacterStore; personal: PersonalStore };
};

/**
 * The real adapters over a real D1 database — wrangler's own local runtime —
 * with nothing but PotterDB faked.
 */
export async function makeWorld(
  corpus: Character[][] = [[character()]],
  { origin = "http://localhost:5173" }: WorldOptions = {},
): Promise<World> {
  const { env: bindings } = await platform();
  await reset(bindings.DB);

  const env: TestEnv = {
    DB: bindings.DB,
    ASSETS: bindings.ASSETS,
    POTTERDB_BASE_URL: "https://api.potterdb.com/v1",
    BETTER_AUTH_SECRET: SECRET,
  };

  const db = openDatabase(env.DB);
  // Auth is built per request, so a test says which address it is being built
  // for: the vite origin by default, or an https one to watch the cookie change.
  const auth = createAuth(env, new Request(`${origin}/api/auth/ok`));
  const catalog = fakeCatalog(corpus);
  const characters = createCharacterStore(db);
  const personal = createPersonalStore(db);

  const services = createServices({
    catalog,
    characters,
    personal,
    migrations: { applied: () => appliedMigrations(db) },
  });

  return { db, d1: env.DB, env, auth, services, catalog, stores: { characters, personal } };
}

/** The tables a test may have written to, in an order cascades can follow. */
const OWNED_TABLES = ["user", "characters", "corpus", "verification", "rateLimit", "d1_migrations"];

/**
 * A world that looks freshly migrated: the rows are gone (cascades take
 * sessions, accounts, favorites and notes with the user), the schema stays, and
 * the ledger is written again. The first world in a file also applies the .sql
 * files, which is what `wrangler d1 migrations apply` does in production.
 */
async function reset(d1: D1Database): Promise<void> {
  const { results } = await d1.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const known = new Set(results.map((row) => String(row.name)));

  // The first world in a file builds the schema; every later one only clears
  // the rows, because the tables are still there and the .sql files are not
  // written to be applied twice.
  if (known.has("characters")) {
    await d1.batch(
      OWNED_TABLES.filter((table) => known.has(table)).map((table) =>
        d1.prepare(`DELETE FROM "${table}"`),
      ),
    );
  } else {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS d1_migrations (
           id         INTEGER PRIMARY KEY AUTOINCREMENT,
           name       TEXT UNIQUE,
           applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`,
      )
      .run();

    for (const name of migrationFiles()) {
      const statements = unstable_splitSqlQuery(readFileSync(join(MIGRATIONS, name), "utf8"));
      await d1.batch(statements.map((statement) => d1.prepare(String(statement))));
    }
  }

  await d1.batch(
    migrationFiles().map((name) => d1.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(name)),
  );
}

const migrationFiles = (): string[] =>
  readdirSync(MIGRATIONS).filter((file) => file.endsWith(".sql")).sort();

/** An account, made the way the browser makes one: Better Auth's own sign-up. */
export async function registerUser(world: World, email = "salma@example.test"): Promise<User> {
  const { response } = await world.auth.api.signUpEmail({
    body: { email, password: PASSWORD, name: email.split("@")[0] ?? "reader" },
    returnHeaders: true,
  });

  return { id: response.user.id, email: response.user.email, name: response.user.name };
}

/** A matcher for the AppError a call is expected to fail with. */
export function rejects(kind: ErrorKind, message?: string) {
  return (error: unknown): boolean => {
    assert.ok(error instanceof AppError, `expected an AppError, got ${String(error)}`);
    assert.equal(error.kind, kind);
    if (message !== undefined) assert.equal(error.message, message);
    return true;
  };
}
