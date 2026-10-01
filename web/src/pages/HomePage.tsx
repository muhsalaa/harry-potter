import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { CharacterGrid } from "../components/CharacterGrid";
import {
  CharacterGridSkeleton,
  LoadingLine,
  NumeralSkeleton,
} from "../components/Skeleton";
import { ListToolbar } from "../components/slots/ListToolbar";
import { PixelScene } from "../components/pixel";
import { useCharacters } from "../hooks/characters";

/**
 * Split Studio, hero revised. The tower leads the page as a full-width band —
 * the index's one picture, before any text — and one masthead row follows it:
 * the corpus number, the page's name, the tagline, the page count, all on a
 * single baseline over a single rule. They used to be two ruled bands stacked,
 * which said "Wizarding Index" and "The index" twice and looked like two
 * sections competing for the same job.
 *
 * Nothing on this page describes how the page is built. A reader is here for
 * the characters.
 */
export function HomePage() {
  const [params] = useSearchParams();
  const requested = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

  const list = useCharacters(page);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const meta = list.data?.meta ?? null;

  return (
    <>
      <section className="page-gutter pt-10">
        <div className="edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
          <PixelScene className="block h-auto w-full" />
        </div>
      </section>

      {/* One band, one rule: the number, the name, the tagline. */}
      <section id="index" className="page-gutter scroll-mt-4 pt-8 pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[3px] border-rule-strong pb-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-5 gap-y-1">
            {meta ? (
              <span className="font-display numeric text-numeral leading-none text-accent">
                {meta.records.toLocaleString("en-US")}
              </span>
            ) : (
              <NumeralSkeleton />
            )}

            <h1 className="font-display text-xl-display text-ink">Wizarding Index</h1>

            <p className="font-display text-md text-muted">
              Every character, shelved in one tower.
            </p>
          </div>

          {meta ? <p className="label numeric text-muted">{meta.pages} pages</p> : null}
        </div>

        <div className="pt-8">
          {list.isError ? (
            <p role="alert" className="max-w-[var(--hp-measure)] text-error">
              The index is not answering. Try page 1 again in a moment.
            </p>
          ) : null}

          {list.isPending ? (
            <>
              <LoadingLine>Opening the index…</LoadingLine>
              <CharacterGridSkeleton />
            </>
          ) : null}

          {list.data ? (
            <>
              <CharacterGrid characters={list.data.data} />
              <ListToolbar
                page={list.data.meta.page}
                pages={list.data.meta.pages}
                records={list.data.meta.records}
                size={list.data.meta.size}
              />
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
