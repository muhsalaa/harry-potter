import { Link } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { PageHead } from "../components/PageHead";
import { CharacterGridSkeleton, Bar, LoadingLine } from "../components/Skeleton";
import { PixelGlyph } from "../components/pixel";
import { useFavorites } from "../hooks/favorites";
import { useSkeletonVisible } from "../hooks/useSkeletonVisible";

/**
 * The list is a query, so the page has no loading flags of its own: whether the
 * session is still being read or the list is still on its way, the page is
 * simply waiting — and it draws the grid that is coming rather than the word
 * "loading…".
 */
export function FavoritesPage() {
  const { status } = useAuth();
  const favorites = useFavorites();

  const busy = status === "checking" || (status === "authenticated" && favorites.isPending);
  const waking = useSkeletonVisible(busy);

  const count = favorites.data?.length ?? null;
  const line =
    count !== null
      ? `${count} marked · private to you`
      : status === "authenticated"
        ? <Bar className="h-3 w-40" />
        : undefined;

  return (
    <>
      <PageHead
        line={line}
        title="Your list"
        lede="The characters you have marked, most recently marked first. Nobody else can see this page, and no count of it appears anywhere."
      />

      <div className="page-gutter pb-16">
        {waking ? (
          <>
            <LoadingLine>Opening your list…</LoadingLine>
            <CharacterGridSkeleton count={8} />
          </>
        ) : null}

        {status === "anonymous" ? (
          <div className="frame max-w-[var(--hp-measure)] p-5">
            <p className="text-muted">A list belongs to an account. Sign in and it will be here.</p>
            <p className="mt-4 flex flex-wrap items-center gap-6">
              <Link to="/login?next=/favorites" className="label text-accent underline">
                Sign in
              </Link>
              <Link to="/register?next=/favorites" className="label text-accent underline">
                Create an account
              </Link>
            </p>
          </div>
        ) : null}

        {favorites.isError ? (
          <p role="alert" className="max-w-[var(--hp-measure)] text-error">
            {favorites.error instanceof Error ? favorites.error.message : "Your list did not load."}{" "}
            Reload the page to try again.
          </p>
        ) : null}

        {status === "authenticated" && favorites.isSuccess && count === 0 ? (
          <div className="frame flex max-w-[var(--hp-measure)] flex-col gap-4 p-6">
            <PixelGlyph kind="quill" className="h-12 w-12" />
            <p className="text-muted">
              Nothing marked yet. Marking a character builds a shortlist you can come back to, and
              the marker stays private to you.
            </p>
            <p>
              <Link to="/" className="label text-accent underline">
                Browse the index
              </Link>
            </p>
          </div>
        ) : null}

        {status === "authenticated" && favorites.data?.length ? (
          <CharacterGrid characters={favorites.data} />
        ) : null}
      </div>
    </>
  );
}
