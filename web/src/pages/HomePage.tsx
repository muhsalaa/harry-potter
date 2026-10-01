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
 * Split Studio. The opening block is a diptych — the index's voice on one side,
 * the tower on the other — and the count below it is set as an object in the
 * pixel face rather than as a sentence. Counts come from the live corpus.
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
  const counts = meta ? `${meta.records} characters · ${meta.pages} pages` : null;

  return (
    <>
      <section className="page-gutter grid gap-10 pt-12 pb-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="min-w-0 [container-type:inline-size]">
          <h1 className="wordmark text-ink">Wizarding Index</h1>

          <p className="mt-6 max-w-[32ch] text-md text-ink">
            Every character, shelved in one tower.
          </p>

          <p className="label numeric mt-6 text-muted">
            {counts ?? "opening the index…"}
          </p>

          <p className="mt-8">
            <a href="#index" className="label inline-flex min-h-11 items-center text-accent underline">
              <span aria-hidden="true" className="caret me-2 rotate-90" />
              Skip to the index
            </a>
          </p>
        </div>

        <div className="min-w-0 lg:justify-self-end">
          <div className="max-w-[44rem] edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
            <PixelScene className="block h-auto w-full" />
          </div>
        </div>
      </section>

      <section id="index" className="page-gutter scroll-mt-4 pt-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b-[3px] border-rule-strong pb-3">
          <div className="flex min-w-0 items-end gap-4">
            {meta ? (
              <span className="glyph numeric text-numeral leading-none text-accent">
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
