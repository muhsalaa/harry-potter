import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { listCharacters, type CharacterList } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { PageHead } from "../components/PageHead";
import { ListToolbar } from "../components/slots/ListToolbar";

type State =
  | { kind: "loading" }
  | { kind: "ready"; list: CharacterList }
  | { kind: "failed"; message: string };

export function HomePage() {
  const [params] = useSearchParams();
  const requested = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;
  const { status } = useAuth();

  const [state, setState] = useState<State>({ kind: "loading" });

  // `status` is a dependency because the API reports the viewer's own favorite
  // and note flags, and those are only known once the session has resolved.
  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });

    listCharacters(page)
      .then((list) => {
        if (live) setState({ kind: "ready", list });
      })
      .catch((problem: unknown) => {
        if (live) {
          setState({
            kind: "failed",
            message: problem instanceof Error ? problem.message : "The index did not load.",
          });
        }
      });

    return () => {
      live = false;
    };
  }, [page, status]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const meta = state.kind === "ready" ? state.list.meta : null;

  return (
    <>
      <PageHead
        line={
          meta
            ? `${meta.records} characters · ${meta.pages} pages of ${meta.size} · from PotterDB`
            : state.kind === "failed"
              ? "the index did not load"
              : "counting the index…"
        }
        title="Every character, in one index"
        lede="Browse the whole PotterDB corpus a page at a time, mark the characters you care about, and keep one private note on each. Nothing you mark or write is visible to anyone else."
      />

      <div className="page-gutter pb-16">
        {state.kind === "failed" ? (
          <p role="alert" className="max-w-[var(--hp-measure)] text-error">
            {state.message} Try page 1, or check that both processes are running.
          </p>
        ) : null}

        {state.kind === "loading" ? (
          <p className="numeric text-sm tracking-[0.1em] text-muted uppercase">loading…</p>
        ) : null}

        {state.kind === "ready" ? (
          <>
            <CharacterGrid characters={state.list.data} />
            <ListToolbar
              page={state.list.meta.page}
              pages={state.list.meta.pages}
              records={state.list.meta.records}
              size={state.list.meta.size}
            />
          </>
        ) : null}
      </div>
    </>
  );
}
