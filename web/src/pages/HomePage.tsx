import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { listCharacters, type CharacterList } from "../api/characters";
import { fetchHealth } from "../api/health";
import { useAuth } from "../auth/AuthContext";
import { CharacterGrid } from "../components/CharacterGrid";
import { ListToolbar } from "../components/slots/ListToolbar";
import { PixelScene } from "../components/pixel";

type State =
  | { kind: "loading" }
  | { kind: "ready"; list: CharacterList }
  | { kind: "failed"; message: string };

/**
 * Marquee Hero: the fold is the whole above-the-fold, and it is one object —
 * the tower, drawn on a 192 × 96 pixel grid. No button lives in the fold; the
 * index begins underneath it and the footer closes with the sentence.
 *
 * The counts under the fold are read from the live corpus, never typed in.
 */
export function HomePage() {
  const [params] = useSearchParams();
  const requested = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;
  const { status } = useAuth();

  const [state, setState] = useState<State>({ kind: "loading" });
  const [service, setService] = useState<string | null>(null);

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
    let live = true;
    fetchHealth()
      .then((health) => {
        if (live) {
          setService(health.ok ? `${health.database.migrations} migrations · ok` : "degraded");
        }
      })
      .catch(() => {
        if (live) setService("unreachable");
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const meta = state.kind === "ready" ? state.list.meta : null;
  const corpus = meta
    ? `${meta.records} characters · ${meta.pages} pages of ${meta.size}`
    : state.kind === "failed"
      ? "the index did not load"
      : "counting the index…";

  return (
    <>
      <section className="relative isolate flex min-h-[min(78vh,40rem)] flex-col justify-end overflow-clip border-b-[3px] border-rule-strong">
        <PixelScene className="absolute inset-0 h-full w-full" />

        <div className="page-gutter relative w-full pb-10">
          <div className="dither max-w-[52rem] border-t-[3px] border-accent p-5 sm:p-7">
            <h1 className="glyph text-wordmark leading-[1.04] text-ink uppercase">
              Wizarding Index
            </h1>
            <p className="mt-5 max-w-[40ch] text-md text-ink">
              Every character, shelved in one tower.
            </p>
            <p className="label numeric mt-4 text-ink">{corpus}</p>
            <p className="mt-5">
              <a href="#index" className="label inline-flex min-h-11 items-center text-ink">
                <span aria-hidden="true" className="caret me-2 rotate-90 text-accent" />
                The index
              </a>
            </p>
          </div>
        </div>
      </section>

      <section id="index" className="page-gutter scroll-mt-4 pt-12 pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[3px] border-rule-strong pb-2">
          <h2 className="font-display text-xl-display text-ink">The index</h2>
          <p className="label numeric text-muted">{corpus}</p>
        </div>

        <div className="pt-8">
          {state.kind === "failed" ? (
            <p role="alert" className="max-w-[var(--hp-measure)] text-error">
              {state.message} Try page 1, or check that both processes are running.
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

      <section className="page-gutter pb-16">
        <p className="label numeric text-muted">service · {service ?? "checking…"}</p>
      </section>
    </>
  );
}
