import { useQuery } from "@tanstack/react-query";

import { listFavorites } from "../api/characters";
import { keys } from "../query";
import { useViewer } from "./viewer";


/**
 * The characters this account has marked. A list belongs to one account, so the
 * viewer is in the key and the query does not run for a reader who has none.
 */
export function useFavorites() {
  const viewer = useViewer();

  return useQuery({
    queryKey: keys.favorites(viewer.key),
    queryFn: listFavorites,
    enabled: viewer.signedIn,
  });
}
