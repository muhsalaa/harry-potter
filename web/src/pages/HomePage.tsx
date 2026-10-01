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
import { useSkeletonVisible } from "../hooks/useSkeletonVisible";

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

  const list = useCharacters(page);
  const waking = useSkeletonVisible(list.isPending);

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
            ) : (
              <NumeralSkeleton />
            )}
            <h2 className="font-display text-xl-display mb-1 text-ink">The index</h2>
          </div>
          {meta ? <p className="label numeric text-muted">{meta.pages} pages</p> : null}
        </div>

        <div className="pt-8">
          {list.isError ? (
            <p role="alert" className="max-w-[var(--hp-measure)] text-error">
              The index is not answering. Try page 1 again in a moment.
            </p>
          ) : null}

          {list.isPending && waking ? (
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
