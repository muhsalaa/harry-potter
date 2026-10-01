import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCharacter, listCharacters, toggleFavorite } from "../api/characters";
import { keys, markFamilies } from "../query";
import { useViewer } from "./viewer";


/**
 * One page of the index. The viewer is in the key and decides whether the query
 * may run (see query.ts): the payload carries this reader's own marks, so
 * fetching under the anonymous key first would spend a request on an answer
 * nobody wants and let the marks flicker in a moment later.
 */
export function useCharacters(page: number) {
  const viewer = useViewer();

  return useQuery({
    queryKey: keys.characters(viewer.key, page),
    queryFn: () => listCharacters(page),
    enabled: viewer.settled,
  });
}

/** One record, by slug. Same viewer rule as the list. */
export function useCharacter(slug: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: keys.character(viewer.key, slug),
    queryFn: () => getCharacter(slug),
    enabled: viewer.settled,
  });
}

/**
 * Marking is instant and private. The press updates the control immediately (it
 * holds its own optimistic state), and settling re-reads every view that shows a
 * mark — the tiles carry one, the record carries one, the favorites list is a
 * different query. The families are named in query.ts, so a press cannot miss a
 * view because a key was renamed. Nothing else has to know about any of it.
 */
export function useToggleFavorite(characterId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFavorite(characterId),
    onSettled: () => {
      for (const family of markFamilies) client.invalidateQueries({ queryKey: [family] });
    },
  });
}
