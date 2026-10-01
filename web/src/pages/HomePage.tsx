import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { listCharacters, type CharacterList } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { ListToolbar } from "../components/slots/ListToolbar";
import { PixelScene } from "../components/pixel";

type State =
  | { kind: "loading" }
  | { kind: "ready"; list: CharacterList }
  | { kind: "failed" };

/**
 * Split Studio, hero revised. The tower leads the page as a full-width band —
 * the index's one picture, before any text — and the title sits under it on a
 * rule with the tagline beside it, the way a plate is captioned. Both the title
 * and the corpus numeral below are set in the page's one display face; the pixel
 * outlier is kept for the two brand marks, so nothing here argues with anything.
 *
 * Nothing on this page describes how the page is built. A reader is here for
 * the characters.
 */
export function HomePage() {
  const [params] = useSearchParams();
  const requested = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;
  const { status } = useAuth();

  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });

    listCharacters(page)
      .then((list) => {
        if (live) setState({ kind: "ready", list });
      })
      .catch((problem: unknown) => {
        console.error("[index] the character list did not load", problem);
        if (live) setState({ kind: "failed" });
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
      <section className="page-gutter pt-10">
        <div className="edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
          <PixelScene className="block h-auto w-full" />
        </div>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b-[3px] border-rule-strong pb-5">
          <h1 className="font-display text-display uppercase text-ink">Wizarding Index</h1>

          <p className="font-display text-md text-muted">
            Every character, shelved in one tower.
          </p>
        </div>
      </section>

      <section id="index" className="page-gutter scroll-mt-4 pt-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b-[3px] border-rule-strong pb-3">
          <div className="flex min-w-0 items-end gap-4">
            {meta ? (
              <span className="font-display numeric text-numeral leading-none text-accent">
                {meta.records.toLocaleString("en-US")}
              </span>
            ) : null}
            <h2 className="font-display text-xl-display mb-1 text-ink">The index</h2>
          </div>
          {meta ? <p className="label numeric text-muted">{meta.pages} pages</p> : null}
        </div>

        <div className="pt-8">
          {state.kind === "failed" ? (
            <p role="alert" className="max-w-[var(--hp-measure)] text-error">
              The index is not answering. Try page 1 again in a moment.
            </p>
          ) : null}

          {state.kind === "loading" ? <p className="label text-muted">loading…</p> : null}

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
      </section>
    </>
  );
}
