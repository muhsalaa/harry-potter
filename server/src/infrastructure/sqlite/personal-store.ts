import type { PersonalStore } from "../../application/ports.ts";
import type { CharacterRow } from "../../domain/character.ts";
import type { Note, ViewerState } from "../../domain/model.ts";
import type { Db } from "./database.ts";

const NOTE_COLUMNS = "SELECT body, updated_at AS updatedAt FROM notes";

export function createPersonalStore(db: Db): PersonalStore {
  const selectFavorites = db.prepare(
    `SELECT c.* FROM favorites f
       JOIN characters c ON c.id = f.character_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC, c.name`,
  );
  const selectFavorite = db.prepare(
    "SELECT 1 FROM favorites WHERE user_id = ? AND character_id = ?",
  );
  const selectNote = db.prepare(`${NOTE_COLUMNS} WHERE user_id = ? AND character_id = ?`);
  const upsertNote = db.prepare(
    `INSERT INTO notes (user_id, character_id, body) VALUES (?, ?, ?)
     ON CONFLICT (user_id, character_id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`,
  );

  const note = (userId: number, characterId: number): Note | null =>
    (selectNote.get(userId, characterId) as Note | undefined) ?? null;

  /** The `favorited` / `hasNote` flags the viewer is entitled to see, by row id. */
  const viewerState = (
    userId: number | null,
    characterIds: number[],
  ): Map<number, ViewerState> => {
    if (!userId || characterIds.length === 0) return new Map();

    const holes = characterIds.map(() => "?").join(", ");
    const marked = (table: "favorites" | "notes") =>
      new Set(
        (
          db
            .prepare(`SELECT character_id FROM ${table} WHERE user_id = ? AND character_id IN (${holes})`)
            .all(userId, ...characterIds) as { character_id: number }[]
        ).map((row) => row.character_id),
      );

    const favorites = marked("favorites");
    const notes = marked("notes");

    return new Map(
      characterIds.map((id) => [id, { favorited: favorites.has(id), hasNote: notes.has(id) }]),
    );
  };

  return {
    favorites: (userId) => selectFavorites.all(userId) as CharacterRow[],

    hasFavorite: (userId, characterId) =>
      selectFavorite.get(userId, characterId) !== undefined,

    addFavorite: (userId, characterId) => {
      db.prepare("INSERT INTO favorites (user_id, character_id) VALUES (?, ?)").run(
        userId,
        characterId,
      );
    },

    removeFavorite: (userId, characterId) => {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND character_id = ?").run(
        userId,
        characterId,
      );
    },

    note,

    saveNote: (userId, characterId, body) => {
      upsertNote.run(userId, characterId, body);

      const saved = note(userId, characterId);
      if (!saved) throw new Error("The note vanished after being saved.");
      return saved;
    },

    viewerState,
  };
}
