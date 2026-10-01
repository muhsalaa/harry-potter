import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after } from "node:test";
import { fileURLToPath } from "node:url";

import { getPlatformProxy, unstable_splitSqlQuery } from "wrangler";

import type { AccountStore, Catalog, CatalogPage, CharacterStore, PersonalStore } from "../src/application/ports.ts";
import { createServices } from "../src/application/services.ts";
import type { Services } from "../src/application/services.ts";
import type { Character } from "../src/domain/character.ts";
import { AppError } from "../src/domain/errors.ts";
import type { ErrorKind } from "../src/domain/errors.ts";
import type { User } from "../src/domain/model.ts";
import { scryptPasswords } from "../src/infrastructure/crypto/passwords.ts";
import { createAccountStore } from "../src/infrastructure/d1/account-store.ts";
import { createCharacterStore } from "../src/infrastructure/d1/character-store.ts";
import { appliedMigrations, openDatabase } from "../src/infrastructure/d1/database.ts";
import type { Db } from "../src/infrastructure/d1/database.ts";
import { createPersonalStore } from "../src/infrastructure/d1/personal-store.ts";

const here = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(here, "..", "..", "wrangler.jsonc");
const MIGRATIONS = join(here, "..", "migrations");

/** The bindings wrangler.jsonc declares, as a test sees them. */
type Bindings = { DB: D1Database; ASSETS: Fetcher };

const running: { dispose(): Promise<void> }[] = [];

after(async () => {
  await Promise.all(running.map((proxy) => proxy.dispose()));
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
  /** The drizzle handle the stores use, and the D1 binding underneath it. */
  db: Db;
  d1: D1Database;
  services: Services;
  catalog: Catalog & { fetches: number };
  stores: { accounts: AccountStore; characters: CharacterStore; personal: PersonalStore };
};

/**
 * The real adapters over a real D1 database — wrangler's own local runtime —
 * with nothing but PotterDB faked. `persist: false` keeps worlds apart.
 */
export async function makeWorld(corpus: Character[][] = [[character()]]): Promise<World> {
  const proxy = await getPlatformProxy<Bindings>({ configPath: CONFIG, persist: false });
  running.push(proxy);

  await migrate(proxy.env.DB);

  const db = openDatabase(proxy.env.DB);
  const catalog = fakeCatalog(corpus);
  const accounts = createAccountStore(db);
  const characters = createCharacterStore(db);
  const personal = createPersonalStore(db);

  const services = createServices({
    catalog,
    characters,
    accounts,
    personal,
    passwords: scryptPasswords,
    migrations: { applied: () => appliedMigrations(db) },
  });

  return { db, d1: proxy.env.DB, services, catalog, stores: { accounts, characters, personal } };
}

/**
 * What `wrangler d1 migrations apply` does to a database that has never seen
 * it: the same .sql files, split the way wrangler splits them, recorded in the
 * same ledger. Applying migrations stays wrangler's job in production.
 */
async function migrate(d1: D1Database): Promise<void> {
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_migrations (
         id         INTEGER PRIMARY KEY AUTOINCREMENT,
         name       TEXT UNIQUE,
         applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
       )`,
    )
    .run();

  const applied = new Set(
    (await d1.prepare("SELECT name FROM d1_migrations").all()).results.map((row) => String(row.name)),
  );

  for (const name of readdirSync(MIGRATIONS).filter((file) => file.endsWith(".sql")).sort()) {
    if (applied.has(name)) continue;

    const statements = unstable_splitSqlQuery(readFileSync(join(MIGRATIONS, name), "utf8"));
    await d1.batch(statements.map((statement) => d1.prepare(String(statement))));
    await d1.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(name).run();
  }
}

export async function registerUser(
  world: World,
  email = "salma@example.test",
): Promise<User> {
  const { user } = await world.services.accounts.register(email, "expelliarmus42");
  return user;
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
