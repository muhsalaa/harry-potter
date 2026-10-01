import { QueryClient } from "@tanstack/react-query";

import type { Status } from "./auth/auth-context";

/**
 * The server cache. Every request in the app goes through it now: the pages hold
 * no loading flags of their own, and a value that came back once is not asked
 * for again just because a component mounted.
 *
 * `staleTime` is a minute because the corpus barely moves — PotterDB owns it,
 * the mirror hands back what it already has — and a refetch on every window
 * focus would spend requests on a list that has not changed. Viewer state rides
 * inside these payloads, which is why the keys are viewer-scoped (see below):
 * two accounts must never share a cache entry.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * The families, named once. A key is written from these and nothing else, so
 * invalidating one cannot drift from the name it was stored under — a second
 * spelling of "characters" fails silently, by leaving a stale mark on screen.
 */
const FAMILY = {
  session: "session",
  characters: "characters",
  character: "character",
  favorites: "favorites",
  note: "note",
} as const;

/**
 * The keys, in one place, so a cache entry cannot be read under a name nothing
 * else would use. `viewer` is the signed-in user's id, or "anonymous": it is
 * part of every key that carries a Favorite or a Note, because those belong to
 * one account and a sign-out must not leave them warm for the next reader.
 */
export const keys = {
  session: () => [FAMILY.session] as const,
  characters: (viewer: string, page: number) => [FAMILY.characters, viewer, page] as const,
  character: (viewer: string, slug: string) => [FAMILY.character, viewer, slug] as const,
  favorites: (viewer: string) => [FAMILY.favorites, viewer] as const,
  note: (viewer: string, characterId: number) => [FAMILY.note, viewer, characterId] as const,
};

/**
 * A Favorite is shown by the index, the record and the list at once, so one
 * press has all three to refresh. A Note is not in here: nothing else displays
 * it, and the save writes the answer straight into its own entry.
 */
export const markFamilies: readonly string[] = [
  FAMILY.characters,
  FAMILY.character,
  FAMILY.favorites,
];

/** The viewer half of a key. Anonymous readers get their own entries, never shared. */
const viewerKey = (userId: number | null | undefined) =>
  userId === null || userId === undefined ? "anonymous" : `u${userId}`;

export type Viewer = {
  /** The half of every key this reader's marks live under. */
  key: string;
  /** The session has answered, so public data may be fetched under this key. */
  settled: boolean;
  /** There is an account behind the key, so private data may be fetched for it. */
  signedIn: boolean;
};

/**
 * What a viewer-scoped query needs to know, derived in one place: which cache
 * entry this reader owns, whether the session has answered, and whether there is
 * an account to ask for private data. Four hooks and every mark on the page read
 * this. A second spelling is how a request goes out under the anonymous key and
 * the marks flicker in a moment later — or, worse, how one account's mark is
 * read under another account's key.
 */
export function viewerOf(status: Status, userId: number | null | undefined): Viewer {
  return {
    key: viewerKey(userId),
    settled: status !== "checking",
    // A session that is authenticated but carries no user is not a viewer: there
    // is nobody to own a mark, so private data is not asked for.
    signedIn: status === "authenticated" && userId !== null && userId !== undefined,
  };
}
