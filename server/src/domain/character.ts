import type { ViewerState } from "./model.ts";

/**
 * The browsable entity, in our names. PotterDB's snake_case and our column
 * names are translations of this and are not spoken anywhere else.
 */
export type Character = {
  potterdbId: string;
  slug: string;
  name: string;
  image?: string | null;
  house?: string | null;
  bloodStatus?: string | null;
  species?: string | null;
  gender?: string | null;
  born?: string | null;
  died?: string | null;
  eyeColor?: string | null;
  hairColor?: string | null;
  skinColor?: string | null;
  height?: string | null;
  weight?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  patronus?: string | null;
  boggart?: string | null;
  animagus?: string | null;
  aliasNames?: string[];
  familyMembers?: string[];
  jobs?: string[];
  romances?: string[];
  titles?: string[];
  wands?: string[];
  wiki?: string | null;
};

/** How many Characters one page holds — ours and PotterDB's, kept in step. */
export const PAGE_SIZE = 24;

type Field = {
  key: keyof Character & string;
  /** PotterDB's attribute name. */
  source: string;
  /** Our column name. */
  column: string;
  kind: "text" | "list";
  /** Left out of the API body: how we find the row, not what it is. */
  internal?: true;
};

/**
 * The single catalogue of Character fields. Every translation — PotterDB in,
 * columns out, API payload out — is driven by this list, so adding a field is
 * one row here and nothing else.
 */
export const CHARACTER_FIELDS = [
  { key: "potterdbId", source: "id", column: "potterdb_id", kind: "text", internal: true },
  { key: "slug", source: "slug", column: "slug", kind: "text" },
  { key: "name", source: "name", column: "name", kind: "text" },
  { key: "image", source: "image", column: "image", kind: "text" },
  { key: "house", source: "house", column: "house", kind: "text" },
  { key: "bloodStatus", source: "blood_status", column: "blood_status", kind: "text" },
  { key: "species", source: "species", column: "species", kind: "text" },
  { key: "gender", source: "gender", column: "gender", kind: "text" },
  { key: "born", source: "born", column: "born", kind: "text" },
  { key: "died", source: "died", column: "died", kind: "text" },
  { key: "eyeColor", source: "eye_color", column: "eye_color", kind: "text" },
  { key: "hairColor", source: "hair_color", column: "hair_color", kind: "text" },
  { key: "skinColor", source: "skin_color", column: "skin_color", kind: "text" },
  { key: "height", source: "height", column: "height", kind: "text" },
  { key: "weight", source: "weight", column: "weight", kind: "text" },
  { key: "nationality", source: "nationality", column: "nationality", kind: "text" },
  { key: "maritalStatus", source: "marital_status", column: "marital_status", kind: "text" },
  { key: "patronus", source: "patronus", column: "patronus", kind: "text" },
  { key: "boggart", source: "boggart", column: "boggart", kind: "text" },
  { key: "animagus", source: "animagus", column: "animagus", kind: "text" },
  { key: "aliasNames", source: "alias_names", column: "alias_names", kind: "list" },
  { key: "familyMembers", source: "family_members", column: "family_members", kind: "list" },
  { key: "jobs", source: "jobs", column: "jobs", kind: "list" },
  { key: "romances", source: "romances", column: "romances", kind: "list" },
  { key: "titles", source: "titles", column: "titles", kind: "list" },
  { key: "wands", source: "wands", column: "wands", kind: "list" },
  { key: "wiki", source: "wiki", column: "wiki", kind: "text" },
] as const satisfies readonly Field[];

export const CHARACTER_COLUMNS: readonly string[] = CHARACTER_FIELDS.map((field) => field.column);

export type CharacterColumn = (typeof CHARACTER_FIELDS)[number]["column"];

/** A row as the database stores it: text, or JSON for the lists. */
export type CharacterColumns = { [C in CharacterColumn]: string | null };

export type CharacterRow = CharacterColumns & {
  id: number;
  list_page: number | null;
  list_index: number | null;
  cached_at: string;
};

/** The shape the API hands the frontend: ours, not PotterDB's. */
export type CharacterPayload = Omit<Character, "potterdbId"> & {
  id: number;
  cachedAt: string;
  viewer?: ViewerState;
};

/** PotterDB's JSON:API envelope, as far as we read into it. */
export type PotterDbEntry = { id: string; attributes: Record<string, unknown> };

/** PotterDB's entry → our names. Missing attributes read as null, missing lists as empty. */
export function fromPotterDb(entry: PotterDbEntry): Character {
  const character: Record<string, unknown> = { potterdbId: entry.id };

  for (const field of CHARACTER_FIELDS) {
    if (field.key === "potterdbId") continue;

    const value = entry.attributes[field.source];
    character[field.key] = field.kind === "list" ? asList(value) : asText(value);
  }

  return character as Character;
}

/** Our names → the values an INSERT binds, keyed by column. */
export function toColumns(character: Character): CharacterColumns {
  const columns: Record<string, string | null> = {};

  for (const field of CHARACTER_FIELDS) {
    const value = character[field.key];
    columns[field.column] = field.kind === "list" ? JSON.stringify(asList(value)) : asText(value);
  }

  return columns as CharacterColumns;
}

/** Our row → the payload the frontend receives. */
export function toPayload(row: CharacterRow, viewer?: ViewerState): CharacterPayload {
  const character: Record<string, unknown> = { id: row.id };

  for (const field of CHARACTER_FIELDS) {
    if ("internal" in field && field.internal) continue;

    const value = row[field.column];
    character[field.key] = field.kind === "list" ? parseList(value) : value;
  }

  return {
    ...(character as Omit<CharacterPayload, "cachedAt" | "viewer">),
    cachedAt: row.cached_at,
    ...(viewer ? { viewer } : {}),
  };
}

const asText = (value: unknown): string | null => (value === undefined || value === null ? null : String(value));

const asList = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

function parseList(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
