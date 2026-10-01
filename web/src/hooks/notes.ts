import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNote, saveNote } from "../api/notes";
import { keys } from "../query";
import { useViewer } from "./viewer";


/** The one Note this account holds on this Character, or null — the absence is an answer. */
export function useNote(characterId: number) {
  const viewer = useViewer();

  return useQuery({
    queryKey: keys.note(viewer.key, characterId),
    queryFn: () => getNote(characterId),
    enabled: viewer.signedIn,
  });
}

/**
 * Saving overwrites the same Note in place, so the server's answer *is* the new
 * cache entry — no refetch, and nothing else on the page owns a copy of it.
 */
export function useSaveNote(characterId: number) {
  const client = useQueryClient();
  const viewer = useViewer();

  return useMutation({
    mutationFn: (body: string) => saveNote(characterId, body),
    onSuccess: (note) => {
      client.setQueryData(keys.note(viewer.key, characterId), note);
    },
  });
}
