import assert from "node:assert/strict";

import type { AccountStore, Catalog, CatalogPage, CharacterStore, PersonalStore } from "../src/application/ports.ts";
import { createServices } from "../src/application/services.ts";
import type { Services } from "../src/application/services.ts";
import type { Character } from "../src/domain/character.ts";
import { AppError } from "../src/domain/errors.ts";
import type { ErrorKind } from "../src/domain/errors.ts";
import type { User } from "../src/domain/model.ts";
import { scryptPasswords } from "../src/infrastructure/crypto/passwords.ts";
import { createAccountStore } from "../src/infrastructure/sqlite/account-store.ts";
import { createCharacterStore } from "../src/infrastructure/sqlite/character-store.ts";
import { appliedMigrations, migrateDatabase, openDatabase } from "../src/infrastructure/sqlite/database.ts";
import type { Db } from "../src/infrastructure/sqlite/database.ts";
import { createPersonalStore } from "../src/infrastructure/sqlite/personal-store.ts";

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
  db: Db;
  services: Services;
  catalog: Catalog & { fetches: number };
  stores: { accounts: AccountStore; characters: CharacterStore; personal: PersonalStore };
};

/** The real adapters over a throwaway database, with nothing but PotterDB faked. */
export function makeWorld(corpus: Character[][] = [[character()]]): World {
  const db = openDatabase(":memory:");
  migrateDatabase(db);

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

  return { db, services, catalog, stores: { accounts, characters, personal } };
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
