import { useAuth } from "../auth/auth-context";
import { viewerOf } from "../query";

import type { Viewer } from "../query";

/**
 * The reader every viewer-scoped query belongs to, in the shape the cache needs:
 * which entry their marks live in, and what may be asked for on their behalf.
 * The two rules behind it — wait for the session, and never ask for private data
 * without an account — are spelled once, in viewerOf.
 */
export function useViewer(): Viewer {
  const { status, user } = useAuth();
  return viewerOf(status, user?.id ?? null);
}
