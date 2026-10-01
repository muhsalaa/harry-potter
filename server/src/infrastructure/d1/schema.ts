import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The tables as drizzle sees them. Nothing here creates anything: the DDL is
 * the .sql files in `migrations/`, which wrangler applies to D1 (and which
 * `test/schema.test.ts` holds this file to).
 *
 * A property is named after its column, so a select comes back shaped like the
 * row types in the domain — `CharacterRow`, `Corpus`, `StoredUser` — and no
 * translation sits between the database and the code that reads it.
 */

/** SQLite's own clock, as a default: the migrations write it, this repeats it. */
const now = () => sql`(datetime('now'))`;

/**
 * Wrangler's own ledger, created by `wrangler d1 migrations apply` — the name
 * and the columns are its, not ours. The health report reads it back.
 */
export const d1Migrations = sqliteTable("d1_migrations", {
  id: integer("id").primaryKey(),
  /** UNIQUE, and nullable: the DDL is wrangler's, and this describes it exactly. */
  name: text("name").unique(),
  applied_at: text("applied_at").notNull().default(now()),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  /** COLLATE NOCASE lives in the migration: lookups stay case-insensitive. */
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: text("created_at").notNull().default(now()),
});

export const sessions = sqliteTable("sessions", {
  /** The sha256 of the cookie token, never the token itself. */
  token_hash: text("token_hash").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: text("created_at").notNull().default(now()),
  expires_at: text("expires_at").notNull(),
});

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey(),
  /** PotterDB's id, theirs; `id` is ours, and favorites and notes point at it. */
  potterdb_id: text("potterdb_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  house: text("house"),
  blood_status: text("blood_status"),
  species: text("species"),
  gender: text("gender"),
  born: text("born"),
  died: text("died"),
  eye_color: text("eye_color"),
  hair_color: text("hair_color"),
  skin_color: text("skin_color"),
  height: text("height"),
  weight: text("weight"),
  nationality: text("nationality"),
  marital_status: text("marital_status"),
  patronus: text("patronus"),
  boggart: text("boggart"),
  animagus: text("animagus"),
  /** Lists are JSON text, as PotterDB hands them over. */
  alias_names: text("alias_names").notNull().default("[]"),
  family_members: text("family_members").notNull().default("[]"),
  jobs: text("jobs").notNull().default("[]"),
  romances: text("romances").notNull().default("[]"),
  titles: text("titles").notNull().default("[]"),
  wands: text("wands").notNull().default("[]"),
  wiki: text("wiki"),
  /** Where the character sits in PotterDB's page order, so a page can be cached. */
  list_page: integer("list_page"),
  list_index: integer("list_index"),
  cached_at: text("cached_at").notNull().default(now()),
});

export const corpus = sqliteTable("corpus", {
  id: integer("id").primaryKey(),
  records: integer("records").notNull(),
  pages: integer("pages").notNull(),
  fetched_at: text("fetched_at").notNull().default(now()),
});

export const favorites = sqliteTable(
  "favorites",
  {
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    character_id: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    created_at: text("created_at").notNull().default(now()),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.character_id] })],
);

export const notes = sqliteTable(
  "notes",
  {
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    character_id: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updated_at: text("updated_at").notNull().default(now()),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.character_id] })],
);
