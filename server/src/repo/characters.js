import { toRow } from "../character-record.js";

const COLUMNS = [
  "potterdb_id", "slug", "name", "image", "house", "blood_status", "species",
  "gender", "born", "died", "eye_color", "hair_color", "skin_color", "height",
  "weight", "nationality", "marital_status", "patronus", "boggart", "animagus",
  "alias_names", "family_members", "jobs", "romances", "titles", "wands",
  "wiki", "list_page", "list_index",
];

const SELECT = "SELECT * FROM characters";

/**
 * Every write goes through INSERT … ON CONFLICT so viewing a page twice leaves
 * exactly one row per Character, however many times it is fetched.
 */
export function savePage(db, characters, page) {
  const sql = `
    INSERT INTO characters (${COLUMNS.join(", ")})
    VALUES (${COLUMNS.map((c) => `@${c}`).join(", ")})
    ON CONFLICT (potterdb_id) DO UPDATE SET
      ${COLUMNS.filter((c) => c !== "potterdb_id")
        .map((c) =>
          // Viewing a single character must not wipe the page it was cached
          // under, so a null never overwrites a known page.
          c === "list_page" || c === "list_index"
            ? `${c} = COALESCE(excluded.${c}, characters.${c})`
            : `${c} = excluded.${c}`,
        )
        .join(",\n      ")},
      cached_at = datetime('now')
  `;

  const insert = db.prepare(sql);

  db.transaction(() => {
    characters.forEach((character, index) => {
      insert.run(toRow(character, { page, index }));
    });
  })();
}

export function saveCharacter(db, character) {
  savePage(db, [character], character.listPage ?? null);
  return readCharacterBySlug(db, character.slug);
}

/**
 * `list_page` is not null-checked for the last page: it must serve whatever it
 * has. ponytail: a cached page is served forever — add a refresh endpoint when
 * a corpus that changes under us starts to matter.
 */
export function readPage(db, page) {
  return db
    .prepare(`${SELECT} WHERE list_page = ? ORDER BY list_index`)
    .all(page);
}

export function readCharacterBySlug(db, slug) {
  return db.prepare(`${SELECT} WHERE slug = ?`).get(slug) ?? null;
}

export function readCorpus(db) {
  return db.prepare("SELECT records, pages, fetched_at FROM corpus WHERE id = 1").get() ?? null;
}

export function saveCorpus(db, { records, pages }) {
  db.prepare(
    `INSERT INTO corpus (id, records, pages, fetched_at) VALUES (1, @records, @pages, datetime('now'))
     ON CONFLICT (id) DO UPDATE SET records = @records, pages = @pages, fetched_at = datetime('now')`,
  ).run({ records, pages });
}

/** The `favorited` / `hasNote` flags the viewer is entitled to see, by row id. */
export function readViewerState(db, userId, characterIds) {
  if (!userId || characterIds.length === 0) return new Map();

  const holes = characterIds.map(() => "?").join(", ");
  const favorites = new Set(
    db
      .prepare(`SELECT character_id FROM favorites WHERE user_id = ? AND character_id IN (${holes})`)
      .all(userId, ...characterIds)
      .map((row) => row.character_id),
  );
  const notes = new Set(
    db
      .prepare(`SELECT character_id FROM notes WHERE user_id = ? AND character_id IN (${holes})`)
      .all(userId, ...characterIds)
      .map((row) => row.character_id),
  );

  return new Map(
    characterIds.map((id) => [id, { favorited: favorites.has(id), hasNote: notes.has(id) }]),
  );
}
