import type { ReactNode } from "react";

import { Bar } from "./skeleton";

type PageHeadProps = {
  /**
   * The inventory line: a count, a range, the character's own facts. Omit it
   * when there is nothing to state — a label that carries no data is a kicker,
   * and kickers are off by default.
   */
  line?: ReactNode;
  title: string;
  lede?: ReactNode;
};

/**
 * A page opens the way a game screen does: one line of fact, one name, one
 * sentence, then a rule the content stands on.
 *
 * The rule is a div, not an `<hr>`: a bare `<hr>` is a black inset bar in the
 * browser's own stylesheet, so any frame painted before the app's CSS arrives
 * (see index.html) would carry one dark line the design does not have.
 */
export function PageHead({ line, title, lede }: PageHeadProps) {
  return (
    <header className="page-gutter pt-10 pb-8">
      {line ? <p className="label numeric text-muted">{line}</p> : null}
      <h1 className={`font-display text-xl-display text-ink${line ? " mt-2" : ""}`}>{title}</h1>
      {lede ? <p className="prose mt-3 max-w-[var(--hp-measure)] text-muted">{lede}</p> : null}
      <div className="mt-6 border-t-[3px] border-rule-strong" aria-hidden="true" />
    </header>
  );
}

/**
 * The same header before its values exist: a bar where the inventory line goes,
 * a bar where the name goes, the same rule. It lives here, under the header it
 * copies, because a skeleton that drifts from its shape is worse than none.
 * The bars are decorative — the page announces the wait with a live region.
 */
export function PageHeadSkeleton() {
  return (
    <header className="page-gutter pt-10 pb-8" aria-hidden="true">
      <Bar className="h-3 w-44" />
      <Bar className="mt-3.5 h-7 w-60" />
      <div className="mt-6 border-t-[3px] border-rule-strong" />
    </header>
  );
}
