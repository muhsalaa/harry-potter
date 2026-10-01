import type { Character, CharacterRow } from "../domain/character.ts";
import type { Corpus, MigrationRecord, Note, ViewerState } from "../domain/model.ts";

/** One page as PotterDB paginates the corpus. */
export type CatalogPage = {
  characters: Character[];
  records: number;
  pages: number;
  page: number;
};

/** PotterDB: a third party we do not control. */
export type Catalog = {
  page(page: number, size: number): Promise<CatalogPage>;
  bySlug(slug: string): Promise<Character | null>;
};

/** The local mirror of the corpus. */
export type CharacterStore = {
  page(page: number): Promise<CharacterRow[]>;
  bySlug(slug: string): Promise<CharacterRow | null>;
  exists(id: number): Promise<boolean>;
  savePage(characters: Character[], page: number): Promise<void>;
  /** Saves one Character without touching the page it may already sit on. */
  saveOne(character: Character): Promise<CharacterRow>;
  corpus(): Promise<Corpus | null>;
  saveCorpus(corpus: { records: number; pages: number }): Promise<void>;
};

/**
 * Every Favorite and Note a User owns, plus the flags derived from them. A User
 * is a string id now — Better Auth's uuid — not a row number of ours.
 */
export type PersonalStore = {
  favorites(userId: string): Promise<CharacterRow[]>;
  hasFavorite(userId: string, characterId: number): Promise<boolean>;
  addFavorite(userId: string, characterId: number): Promise<void>;
  removeFavorite(userId: string, characterId: number): Promise<void>;
  note(userId: string, characterId: number): Promise<Note | null>;
  saveNote(userId: string, characterId: number, body: string): Promise<Note>;
  viewerState(userId: string | null, characterIds: number[]): Promise<Map<number, ViewerState>>;
};

/** The migration ledger, as the health report reads it. */
export type Migrations = { applied(): Promise<MigrationRecord[]> };

/** Everything the application layer is given. It creates none of it. */
export type Dependencies = {
  catalog: Catalog;
  characters: CharacterStore;
  personal: PersonalStore;
  migrations: Migrations;
};
