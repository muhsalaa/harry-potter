import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The tables as drizzle sees them. Nothing here creates anything: the DDL is
 * the .sql files in `migrations/`, which wrangler applies to D1 (and which
 * `test/schema.test.ts` holds this file to).
 *
 * A property is named after its column, so a select comes back shaped like the
 * row types in the domain — `CharacterRow`, `Corpus`, `User` — and no
 * translation sits between the database and the code that reads it.
 *
 * The four `user` / `session` / `account` / `verification` tables are Better
 * Auth's, not ours: their names, their columns, their timestamps as integer
 * milliseconds. We describe them here so the adapter can query them and so a
 * select can be typed; nothing in this app writes them by hand.
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

/* ── Better Auth ─────────────────────────────────────────────────────────────
 * Dates are integer milliseconds and booleans are 0/1, because that is how the
 * drizzle adapter reads and writes them for sqlite.
 * ------------------------------------------------------------------------- */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  /** The cookie carries the token; this row is what makes it real. */
  token: text("token").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  /** `credential` for a password, and the user's id as the account id. */
  providerId: text("providerId").notNull(),
  accountId: text("accountId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The scrypt hash, for a credential account. */
  password: text("password"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope: text("scope"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

/** Single-use tokens; with no email flows configured, this stays empty. */
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

/** Only written when rate limiting is told to keep its counters in the database. */
export const rateLimit = sqliteTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: integer("lastRequest").notNull(),
});

/* ── Ours ────────────────────────────────────────────────────────────────── */

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

/** Both point at Better Auth's `user.id`, which is a uuid string, not a number. */
export const favorites = sqliteTable(
  "favorites",
  {
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    user_id: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    character_id: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updated_at: text("updated_at").notNull().default(now()),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.character_id] })],
);
