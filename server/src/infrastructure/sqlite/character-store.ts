import { eq, getTableName, sql } from "drizzle-orm";

import { CHARACTER_COLUMNS, toColumns } from "../../domain/character.ts";
import type { Character, CharacterRow } from "../../domain/character.ts";
import type { CharacterStore } from "../../application/ports.ts";
import type { Db } from "./database.ts";
import { characters, corpus as corpusTable } from "./schema.ts";

type CharacterInsert = typeof characters.$inferInsert;

/** Writes take an executor: the store's db, or — inside savePage — its transaction. */
type Writer = Pick<Db, "insert">;

const POSITIONS = ["list_page", "list_index"];

/** Everything a write carries: the Character's own columns, plus where it sits on a page. */
const COLUMNS: readonly string[] = [...CHARACTER_COLUMNS, ...POSITIONS];
const IS_POSITION = new Set<string>(POSITIONS);

const TABLE = sql.identifier(getTableName(characters));

/**
 * Every write goes through INSERT … ON CONFLICT so viewing a page twice leaves
 * exactly one row per Character, however many times it is fetched. Reading a
 * single Character must not wipe the page it was cached under, so a null
 * position never overwrites a known one — and the SET clause has to cover the
 * position columns, or a page that is re-fetched (a cleared mirror, a changed
 * page size) would be read back as empty.
 *
 * Built from CHARACTER_FIELDS, so a new field is still one row in that list.
 */
const OVERWRITE = Object.fromEntries(
  COLUMNS.filter((column) => column !== "potterdb_id").map((column) => [
    column,
    IS_POSITION.has(column)
      ? sql`coalesce(excluded.${sql.identifier(column)}, ${TABLE}.${sql.identifier(column)})`
      : sql`excluded.${sql.identifier(column)}`,
  ]),
);

/**
 * A Character as a row, and where it sits on a page when it is fetched as one.
 * The catalogue types every column as nullable text, so the values are grafted
 * onto the table's insert shape here — the one place the two are reconciled.
 */
const values = (
  character: Character,
  position: { page: number; index: number } | null = null,
): CharacterInsert =>
  ({
    ...toColumns(character),
    list_page: position?.page ?? null,
    list_index: position?.index ?? null,
    // The catalogue types every column as nullable text; the three required
    // ones are filled by it, and the lists are JSON by the time they get here.
  }) as CharacterInsert;

export function createCharacterStore(db: Db): CharacterStore {
  const upsert = (writer: Writer, row: CharacterInsert) =>
    writer
      .insert(characters)
      .values(row)
      .onConflictDoUpdate({
        target: characters.potterdb_id,
        set: { ...OVERWRITE, cached_at: sql`datetime('now')` },
      });

  const bySlug = (slug: string): CharacterRow | null =>
    db.select().from(characters).where(eq(characters.slug, slug)).get() ?? null;

  return {
    page: (page) =>
      db
        .select()
        .from(characters)
        .where(eq(characters.list_page, page))
        .orderBy(characters.list_index)
        .all(),

    bySlug,

    exists: (id) =>
      db.select({ id: characters.id }).from(characters).where(eq(characters.id, id)).get() !==
      undefined,

    savePage: (page_, page) => {
      db.transaction((tx) => {
        page_.forEach((character, index) => {
          upsert(tx, values(character, { page, index })).run();
        });
      });
    },

    saveOne: (character) => {
      upsert(db, values(character)).run();

      const row = bySlug(character.slug);
      if (!row) throw new Error(`Character ${character.slug} vanished after being saved.`);
      return row;
    },

    corpus: () =>
      db
        .select({
          records: corpusTable.records,
          pages: corpusTable.pages,
          fetchedAt: corpusTable.fetched_at,
        })
        .from(corpusTable)
        .where(eq(corpusTable.id, 1))
        .get() ?? null,

    saveCorpus: ({ records, pages }) => {
      db.insert(corpusTable)
        .values({ id: 1, records, pages })
        .onConflictDoUpdate({
          target: corpusTable.id,
          set: { records, pages, fetched_at: sql`datetime('now')` },
        })
        .run();
    },
  };
}
