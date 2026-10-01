import { useState } from "react";
import { Link } from "react-router";

import { toggleFavorite } from "../../api/characters";
import { useAuth } from "../../auth/AuthContext";
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
 * The press updates immediately and rolls back if the request fails — a toggle
 * that waits for a round trip feels broken.
 */
export function FavoriteControl({ characterId, slug, initiallyFavorited }: FavoriteControlProps) {
  const { status } = useAuth();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "checking") return null;

  if (status === "anonymous") {
    return (
      <p className="numeric text-sm text-muted">
        <Link to={`/login?next=/characters/${slug}`} className="text-accent-deep">
          Sign in
        </Link>{" "}
        to keep {slug.replace(/-/g, " ")} in your list.
      </p>
    );
  }

  async function press() {
    const previous = favorited;
    setFavorited(!previous);
    setError(null);
    setBusy(true);

    try {
      const result = await toggleFavorite(characterId);
      setFavorited(result.favorited);
    } catch (problem) {
      setFavorited(previous);
      setError(problem instanceof Error ? problem.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button onClick={press} loading={busy} aria-pressed={favorited}>
        {favorited ? "In your favorites" : "Add to favorites"}
      </Button>

      <p className="numeric mt-2 text-xs tracking-[0.1em] text-muted uppercase">
        {favorited ? "private to you" : "kept private, never counted"}
      </p>

      {error ? (
        <p role="alert" className="mt-1 max-w-[var(--hp-measure)] text-sm text-error">
          {error} Nothing changed — try again.
        </p>
      ) : null}
    </div>
  );
}
