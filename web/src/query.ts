import { QueryClient } from "@tanstack/react-query";

/**
 * The server cache. Every request in the app goes through it now: the pages hold
 * no loading flags of their own, and a value that came back once is not asked
 * for again just because a component mounted.
 *
 * `staleTime` is a minute because the corpus barely moves — PotterDB owns it,
 * the mirror hands back what it already has — and a refetch on every window
 * focus would spend requests on a list that has not changed. Viewer state rides
 * inside these payloads, which is why the keys are viewer-scoped (see keys.ts):
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
 * The keys, in one place, so a cache entry cannot be read under a name nothing
 * else would use. `viewer` is the signed-in user's id, or "anonymous": it is
 * part of every key that carries a Favorite or a Note, because those belong to
 * one account and a sign-out must not leave them warm for the next reader.
 */
export const keys = {
  session: () => ["session"] as const,
  characters: (viewer: string, page: number) => ["characters", viewer, page] as const,
  character: (viewer: string, slug: string) => ["character", viewer, slug] as const,
  favorites: (viewer: string) => ["favorites", viewer] as const,
  note: (viewer: string, characterId: number) => ["note", viewer, characterId] as const,
};

/** The viewer half of a key. Anonymous readers get their own entries, never shared. */
export const viewerKey = (userId: number | null | undefined) =>
  userId === null || userId === undefined ? "anonymous" : `u${userId}`;
