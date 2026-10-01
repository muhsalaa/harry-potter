import { useState } from "react";
import { Link } from "react-router";

import { useAuth } from "../../auth/AuthContext";
import { useToggleFavorite } from "../../hooks/characters";
import { Button } from "../Button";

type FavoriteControlProps = {
  characterId: number;
  slug: string;
  initiallyFavorited: boolean;
};

/**
 * A Favorite is private to one User: this control never shows a count, and no
 * endpoint behind it returns one (ADR-0002).
 *
 * Two colours, two meanings: amber is the action, the cauldron teal is the
 * state you own. The press updates immediately and rolls back on failure — a
 * toggle that waits for a round trip feels broken. Settling also tells the
 * cache, so the tiles that carry the same mark catch up without being asked.
 */
export function FavoriteControl({ characterId, slug, initiallyFavorited }: FavoriteControlProps) {
  const { status } = useAuth();
  const toggle = useToggleFavorite(characterId);
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [error, setError] = useState<string | null>(null);

  if (status === "checking") return null;

  if (status === "anonymous") {
    return (
      <p className="prose max-w-[var(--hp-measure)] text-muted">
        <Link to={`/login?next=/characters/${slug}`}>Sign in</Link>{" "}
        to keep this character in your list.
      </p>
    );
  }

  async function press() {
    const previous = favorited;
    setFavorited(!previous);
    setError(null);

    try {
      const result = await toggle.mutateAsync();
      setFavorited(result.favorited);
    } catch (problem) {
      setFavorited(previous);
      setError(problem instanceof Error ? problem.message : "That did not save.");
    }
  }

  return (
    <div>
      <Button
        onClick={press}
        loading={toggle.isPending}
        aria-pressed={favorited}
        variant={favorited ? "state" : "slab"}
      >
        {favorited ? "In your list" : "Add to your list"}
      </Button>

      <p className="label mt-2 text-muted">
        {favorited ? "kept private to you" : "private · never counted"}
      </p>

      {error ? (
        <p role="alert" className="mt-1 max-w-[var(--hp-measure)] text-sm text-error">
          {error} Nothing changed — try again.
        </p>
      ) : null}
    </div>
  );
}
