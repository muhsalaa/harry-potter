import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";

import type { PersonalStore } from "../../application/ports.ts";
import type { Note, ViewerState } from "../../domain/model.ts";
import type { Db } from "./database.ts";
import { characters, favorites, notes } from "./schema.ts";

export function createPersonalStore(db: Db): PersonalStore {
  const note = (userId: number, characterId: number): Note | null =>
    db
      .select({ body: notes.body, updatedAt: notes.updated_at })
      .from(notes)
      .where(and(eq(notes.user_id, userId), eq(notes.character_id, characterId)))
      .get() ?? null;

  /** The `favorited` / `hasNote` flags the viewer is entitled to see, by row id. */
  const viewerState = (
    userId: number | null,
    characterIds: number[],
  ): Map<number, ViewerState> => {
    if (!userId || characterIds.length === 0) return new Map();

    const marked = (table: typeof favorites | typeof notes) =>
      new Set(
        db
          .select({ character_id: table.character_id })
          .from(table)
          .where(and(eq(table.user_id, userId), inArray(table.character_id, characterIds)))
          .all()
          .map((row) => row.character_id),
      );

    const favorited = marked(favorites);
    const annotated = marked(notes);

    return new Map(
      characterIds.map((id) => [id, { favorited: favorited.has(id), hasNote: annotated.has(id) }]),
    );
  };

  return {
    favorites: (userId) =>
      db
        .select({ ...getTableColumns(characters) })
        .from(favorites)
        .innerJoin(characters, eq(characters.id, favorites.character_id))
        .where(eq(favorites.user_id, userId))
        .orderBy(desc(favorites.created_at), characters.name)
        .all(),

    hasFavorite: (userId, characterId) =>
      db
        .select({ character_id: favorites.character_id })
        .from(favorites)
        .where(and(eq(favorites.user_id, userId), eq(favorites.character_id, characterId)))
        .get() !== undefined,

    addFavorite: (userId, characterId) => {
      db.insert(favorites).values({ user_id: userId, character_id: characterId }).run();
    },

    removeFavorite: (userId, characterId) => {
      db.delete(favorites)
        .where(and(eq(favorites.user_id, userId), eq(favorites.character_id, characterId)))
        .run();
    },

    note,

    saveNote: (userId, characterId, body) => {
      db.insert(notes)
        .values({ user_id: userId, character_id: characterId, body })
        .onConflictDoUpdate({
          target: [notes.user_id, notes.character_id],
          set: { body, updated_at: sql`datetime('now')` },
        })
        .run();

      const saved = note(userId, characterId);
      if (!saved) throw new Error("The note vanished after being saved.");
      return saved;
    },

    viewerState,
  };
}
