import type { ReactNode } from "react";

type PageHeadProps = {
  /** The inventory line: a count, a range, a date. Never a decorative eyebrow. */
  line: ReactNode;
  title: string;
  lede?: ReactNode;
};

/**
 * A page opens the way a game screen does: one meta line, one name, one
 * sentence, then a rule the content stands on.
 */
export function PageHead({ line, title, lede }: PageHeadProps) {
  return (
    <header className="page-gutter pt-10 pb-8">
      <p className="label numeric text-muted">{line}</p>
      <h1 className="font-display text-xl-display mt-2 text-ink">{title}</h1>
      {lede ? <p className="prose mt-3 max-w-[var(--hp-measure)] text-muted">{lede}</p> : null}
      <hr className="mt-6 border-0 border-t-[3px] border-rule-strong" aria-hidden="true" />
    </header>
  );
}
