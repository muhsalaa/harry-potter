import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCharacter, listCharacters, toggleFavorite } from "../api/characters";
import { keys, viewerKey } from "../query";
import { useAuth } from "../auth/AuthContext";

/**
 * One page of the index. The viewer is in the key (see query.ts), and the query
 * waits for the session before it runs: the payload carries this reader's own
 * marks, so fetching under the anonymous key first would spend a request on an
 * answer nobody wants and let the marks flicker in a moment later.
 */
export function useCharacters(page: number) {
  const { status, user } = useAuth();

  return useQuery({
    queryKey: keys.characters(viewerKey(user?.id), page),
    queryFn: () => listCharacters(page),
    enabled: status !== "checking",
  });
}

/** One record, by slug. Same session rule as the list. */
export function useCharacter(slug: string) {
  const { status, user } = useAuth();

  return useQuery({
    queryKey: keys.character(viewerKey(user?.id), slug),
    queryFn: () => getCharacter(slug),
    enabled: status !== "checking",
  });
}

/**
 * Marking is instant and private. The press updates the control immediately (it
 * holds its own optimistic state), and settling re-reads whatever else shows
 * the same fact — the tiles carry a mark of their own, and the favorites list is
 * a different query. Nothing else has to know about either.
 */
export function useToggleFavorite(characterId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFavorite(characterId),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ["characters"] });
      client.invalidateQueries({ queryKey: ["character"] });
      client.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
