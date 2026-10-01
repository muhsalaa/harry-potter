import { useQuery } from "@tanstack/react-query";

import { listFavorites } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import { keys, viewerKey } from "../query";

/**
 * The characters this account has marked. A list belongs to one account, so the
 * viewer is in the key and the query does not run for a reader who has none.
 */
export function useFavorites() {
  const { status, user } = useAuth();

  return useQuery({
    queryKey: keys.favorites(viewerKey(user?.id)),
    queryFn: listFavorites,
    enabled: status === "authenticated" && Boolean(user),
  });
}
