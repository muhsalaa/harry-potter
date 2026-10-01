import { toPayload } from "../domain/character.ts";
import { notFound } from "../domain/errors.ts";
import { checkNoteBody } from "../domain/rules.ts";
import type { CharacterPayload } from "../domain/character.ts";
import type { Note } from "../domain/model.ts";
import type { Dependencies } from "./ports.ts";

export function createPersonal({ characters, personal }: Dependencies) {
  return {
    async listFavorites(userId: string): Promise<{ data: CharacterPayload[] }> {
      const rows = await personal.favorites(userId);
      const viewer = await personal.viewerState(userId, rows.map((row) => row.id));

      return { data: rows.map((row) => toPayload(row, viewer.get(row.id))) };
    },

    /**
     * A toggle, not a create: the pair is the identity, so pressing it twice
     * leaves nothing behind. No count is ever returned — a Favorite is private
     * (ADR-0002).
     */
    async toggleFavorite(
      userId: string,
      characterId: number | null,
    ): Promise<{ favorited: boolean }> {
      if (characterId === null || !(await characters.exists(characterId))) {
        throw notFound("No such character.");
      }

      const favorited = await personal.hasFavorite(userId, characterId);
      if (favorited) await personal.removeFavorite(userId, characterId);
      else await personal.addFavorite(userId, characterId);

      return { favorited: !favorited };
    },

    async readNote(userId: string, characterId: number | null): Promise<{ note: Note | null }> {
      return { note: characterId === null ? null : await personal.note(userId, characterId) };
    },

    /**
     * One row per User and Character, so this is a save, not an append: saving
     * again overwrites in place. There is no delete and no history.
     */
    async saveNote(
      userId: string,
      characterId: number | null,
      body: string,
    ): Promise<{ note: Note }> {
      if (characterId === null || !(await characters.exists(characterId))) {
        throw notFound("No such character.");
      }

      return { note: await personal.saveNote(userId, characterId, checkNoteBody(body)) };
    },
  };
}
