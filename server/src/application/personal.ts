import { toPayload } from "../domain/character.ts";
import { notFound } from "../domain/errors.ts";
import { checkNoteBody } from "../domain/rules.ts";
import type { CharacterPayload } from "../domain/character.ts";
import type { Note } from "../domain/model.ts";
import type { Dependencies } from "./ports.ts";

export function createPersonal({ characters, personal }: Dependencies) {
  return {
    listFavorites(userId: number): { data: CharacterPayload[] } {
      const rows = personal.favorites(userId);
      const viewer = personal.viewerState(userId, rows.map((row) => row.id));

      return { data: rows.map((row) => toPayload(row, viewer.get(row.id))) };
    },

    /**
     * A toggle, not a create: the pair is the identity, so pressing it twice
     * leaves nothing behind. No count is ever returned — a Favorite is private
     * (ADR-0002).
     */
    toggleFavorite(userId: number, characterId: number | null): { favorited: boolean } {
      if (characterId === null || !characters.exists(characterId)) {
        throw notFound("No such character.");
      }

      const favorited = personal.hasFavorite(userId, characterId);
      if (favorited) personal.removeFavorite(userId, characterId);
      else personal.addFavorite(userId, characterId);

      return { favorited: !favorited };
    },

    readNote(userId: number, characterId: number | null): { note: Note | null } {
      return { note: characterId === null ? null : personal.note(userId, characterId) };
    },

    /**
     * One row per User and Character, so this is a save, not an append: saving
     * again overwrites in place. There is no delete and no history.
     */
    saveNote(userId: number, characterId: number | null, body: string): { note: Note } {
      if (characterId === null || !characters.exists(characterId)) {
        throw notFound("No such character.");
      }

      return { note: personal.saveNote(userId, characterId, checkNoteBody(body)) };
    },
  };
}
