import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNote, saveNote } from "../api/notes";
import { useAuth } from "../auth/AuthContext";
import { keys, viewerKey } from "../query";

/** The one Note this account holds on this Character, or null — the absence is an answer. */
export function useNote(characterId: number) {
  const { status, user } = useAuth();

  return useQuery({
    queryKey: keys.note(viewerKey(user?.id), characterId),
    queryFn: () => getNote(characterId),
    enabled: status === "authenticated" && Boolean(user),
  });
}

/**
 * Saving overwrites the same Note in place, so the server's answer *is* the new
 * cache entry — no refetch, and nothing else on the page owns a copy of it.
 */
export function useSaveNote(characterId: number) {
  const client = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (body: string) => saveNote(characterId, body),
    onSuccess: (note) => {
      client.setQueryData(keys.note(viewerKey(user?.id), characterId), note);
    },
  });
}
