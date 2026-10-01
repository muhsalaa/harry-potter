import { CHARACTER_COLUMNS, toColumns } from "../../domain/character.ts";
import type { CharacterRow } from "../../domain/character.ts";
import type { Corpus } from "../../domain/model.ts";
import type { CharacterStore } from "../../application/ports.ts";
import type { Db } from "./database.ts";

const SELECT = "SELECT * FROM characters";

/** A page position is only ever overwritten by another one, never by a slug fetch. */
const POSITIONS = new Set(["list_page", "list_index"]);
const COLUMNS = [...CHARACTER_COLUMNS, ...POSITIONS];

/**
 * Every write goes through INSERT … ON CONFLICT so viewing a page twice leaves
 * exactly one row per Character, however many times it is fetched. Reading a
 * single Character must not wipe the page it was cached under, so a null
 * position never overwrites a known one — and the SET clause has to cover the
 * position columns, or a page that is re-fetched (a cleared mirror, a changed
 * page size) would be read back as empty.
 */
const INSERT = `
  INSERT INTO characters (${COLUMNS.join(", ")})
  VALUES (${COLUMNS.map((column) => `@${column}`).join(", ")})
  ON CONFLICT (potterdb_id) DO UPDATE SET
    ${COLUMNS.filter((column) => column !== "potterdb_id")
      .map((column) =>
        POSITIONS.has(column)
          ? `${column} = COALESCE(excluded.${column}, characters.${column})`
          : `${column} = excluded.${column}`,
      )
      .join(",\n    ")},
    cached_at = datetime('now')
`;

export function createCharacterStore(db: Db): CharacterStore {
  const insert = db.prepare(INSERT);
  const selectPage = db.prepare(`${SELECT} WHERE list_page = ? ORDER BY list_index`);
  const selectBySlug = db.prepare(`${SELECT} WHERE slug = ?`);

  const bySlug = (slug: string): CharacterRow | null =>
    (selectBySlug.get(slug) as CharacterRow | undefined) ?? null;

  return {
    page: (page) => selectPage.all(page) as CharacterRow[],
    bySlug,
    exists: (id) => db.prepare("SELECT 1 FROM characters WHERE id = ?").get(id) !== undefined,

    savePage: (characters, page) => {
      db.transaction(() => {
        characters.forEach((character, index) => {
          insert.run({ ...toColumns(character), list_page: page, list_index: index });
        });
      })();
    },

    saveOne: (character) => {
      db.transaction(() => {
        insert.run({ ...toColumns(character), list_page: null, list_index: null });
      })();

      const row = bySlug(character.slug);
      if (!row) throw new Error(`Character ${character.slug} vanished after being saved.`);
      return row;
    },

    corpus: () =>
      (db
        .prepare("SELECT records, pages, fetched_at AS fetchedAt FROM corpus WHERE id = 1")
        .get() as Corpus | undefined) ?? null,

    saveCorpus: ({ records, pages }) => {
      db.prepare(
        `INSERT INTO corpus (id, records, pages, fetched_at) VALUES (1, @records, @pages, datetime('now'))
         ON CONFLICT (id) DO UPDATE SET records = @records, pages = @pages, fetched_at = datetime('now')`,
      ).run({ records, pages });
    },
  };
}
