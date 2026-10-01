import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listFavorites, type Character } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { PageHead } from "../components/PageHead";
import { PixelGlyph } from "../components/pixel";

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
        title="Your list"
        lede="The characters you have marked, most recently marked first. Nobody else can see this page, and no count of it appears anywhere."
      />

      <div className="page-gutter pb-16">
        {status === "checking" ? <p className="label text-muted">loading…</p> : null}

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

        {state.kind === "failed" ? (
          <p role="alert" className="max-w-[var(--hp-measure)] text-error">
            {state.message} Reload the page to try again.
          </p>
        ) : null}

        {status === "authenticated" && state.kind === "ready" && count === 0 ? (
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

        {status === "authenticated" && state.kind === "ready" && count ? (
          <CharacterGrid characters={state.characters} />
        ) : null}
      </div>
    </>
  );
}
