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
  page(page: number): CharacterRow[];
  bySlug(slug: string): CharacterRow | null;
  exists(id: number): boolean;
  savePage(characters: Character[], page: number): void;
  /** Saves one Character without touching the page it may already sit on. */
  saveOne(character: Character): CharacterRow;
  corpus(): Corpus | null;
  saveCorpus(corpus: { records: number; pages: number }): void;
};

/** Users, and the sessions that stand for them. */
export type AccountStore = {
  byEmail(email: string): StoredUser | null;
  create(email: string, passwordHash: string): User;
  /** Opens a session and returns the cookie token — the hash never leaves here. */
  openSession(userId: number): string;
  resolveSession(token: string): User | null;
  closeSession(token: string): void;
  sweepSessions(): number;
};

/** Every Favorite and Note a User owns, plus the flags derived from them. */
export type PersonalStore = {
  favorites(userId: number): CharacterRow[];
  hasFavorite(userId: number, characterId: number): boolean;
  addFavorite(userId: number, characterId: number): void;
  removeFavorite(userId: number, characterId: number): void;
  note(userId: number, characterId: number): Note | null;
  saveNote(userId: number, characterId: number, body: string): Note;
  viewerState(userId: number | null, characterIds: number[]): Map<number, ViewerState>;
};

/** Passwords are hashed on the way in and compared on the way back. */
export type Passwords = {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
};

/** The migration ledger, as the health report reads it. */
export type Migrations = { applied(): MigrationRecord[] };

/** Everything the application layer is given. It creates none of it. */
export type Dependencies = {
  catalog: Catalog;
  characters: CharacterStore;
  accounts: AccountStore;
  personal: PersonalStore;
  passwords: Passwords;
  migrations: Migrations;
};
