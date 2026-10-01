import type { ReactNode } from "react";

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
 */
export function PageHead({ line, title, lede }: PageHeadProps) {
  return (
    <header className="page-gutter pt-10 pb-8">
      {line ? <p className="label numeric text-muted">{line}</p> : null}
      <h1 className={`font-display text-xl-display text-ink${line ? " mt-2" : ""}`}>{title}</h1>
      {lede ? <p className="prose mt-3 max-w-[var(--hp-measure)] text-muted">{lede}</p> : null}
      <hr className="mt-6 border-0 border-t-[3px] border-rule-strong" aria-hidden="true" />
    </header>
  );
}
