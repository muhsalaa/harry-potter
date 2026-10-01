import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listFavorites, type Character } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { PageHead } from "../components/PageHead";

type State =
  | { kind: "loading" }
  | { kind: "ready"; characters: Character[] }
  | { kind: "failed"; message: string };

export function FavoritesPage() {
  const { status } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (status !== "authenticated") return;

    let live = true;
    setState({ kind: "loading" });

    listFavorites()
      .then((characters) => {
        if (live) setState({ kind: "ready", characters });
      })
      .catch((problem: unknown) => {
        if (live) {
          setState({
            kind: "failed",
            message: problem instanceof Error ? problem.message : "Your list did not load.",
          });
        }
      });

    return () => {
      live = false;
    };
  }, [status]);

  const count = state.kind === "ready" ? state.characters.length : null;

  return (
    <>
      <PageHead
        line={count === null ? "your list" : `${count} marked · private to you`}
        title="Favorites"
        lede="The characters you have marked, most recently marked first. Nobody else can see this page, and no count of it appears anywhere."
      />

      <div className="page-gutter pb-16">
        {status === "checking" ? (
          <p className="numeric text-sm tracking-[0.1em] text-muted uppercase">loading…</p>
        ) : null}

        {status === "anonymous" ? (
          <div className="max-w-[var(--hp-measure)]">
            <p className="text-muted">
              A list belongs to an account. Sign in and it will be here.
            </p>
            <p className="mt-4 flex flex-wrap gap-4">
              <Link to="/login?next=/favorites" className="text-accent-deep">
                Sign in
              </Link>
              <Link to="/register?next=/favorites" className="text-accent-deep">
                Create an account
              </Link>
            </p>
          </div>
        ) : null}

        {state.kind === "failed" ? (
          <p role="alert" className="max-w-[var(--hp-measure)] text-error">
            {state.message} Reload the page to try again.
          </p>
        ) : null}

        {status === "authenticated" && state.kind === "ready" && count === 0 ? (
          <div className="max-w-[var(--hp-measure)]">
            <p className="numeric text-sm tracking-[0.1em] text-muted uppercase">
              no favorites yet
            </p>
            <p className="mt-2 text-muted">
              Marking a character is how you build a shortlist you can come back to; the marker
              stays private.
            </p>
            <p className="mt-4">
              <Link to="/" className="text-accent-deep">
                Browse the index
              </Link>
            </p>
          </div>
        ) : null}

        {status === "authenticated" && state.kind === "ready" && count ? (
          <CharacterGrid characters={state.characters} />
        ) : null}
      </div>
    </>
  );
}
