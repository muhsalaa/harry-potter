import type { Character, CharacterRow } from "../domain/character.ts";
import type { Corpus, MigrationRecord, Note, StoredUser, User, ViewerState } from "../domain/model.ts";

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

/** Users, and the sessions that stand for them. */
export type AccountStore = {
  byEmail(email: string): Promise<StoredUser | null>;
  create(email: string, passwordHash: string): Promise<User>;
  /** Opens a session and returns the cookie token — the hash never leaves here. */
  openSession(userId: number): Promise<string>;
  resolveSession(token: string): Promise<User | null>;
  closeSession(token: string): Promise<void>;
  /** Removes the rows that can no longer be read; returns how many. */
  sweepSessions(): Promise<number>;
};

/** Every Favorite and Note a User owns, plus the flags derived from them. */
export type PersonalStore = {
  favorites(userId: number): Promise<CharacterRow[]>;
  hasFavorite(userId: number, characterId: number): Promise<boolean>;
  addFavorite(userId: number, characterId: number): Promise<void>;
  removeFavorite(userId: number, characterId: number): Promise<void>;
  note(userId: number, characterId: number): Promise<Note | null>;
  saveNote(userId: number, characterId: number, body: string): Promise<Note>;
  viewerState(userId: number | null, characterIds: number[]): Promise<Map<number, ViewerState>>;
};

/** Passwords are hashed on the way in and compared on the way back. */
export type Passwords = {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
};

/** The migration ledger, as the health report reads it. */
export type Migrations = { applied(): Promise<MigrationRecord[]> };

/** Everything the application layer is given. It creates none of it. */
export type Dependencies = {
  catalog: Catalog;
  characters: CharacterStore;
  accounts: AccountStore;
  personal: PersonalStore;
  passwords: Passwords;
  migrations: Migrations;
};
