import type { ReactNode } from "react";

type PageHeadProps = {
  /** The inventory line: a count, a range, a date. Never a decorative eyebrow. */
  line: ReactNode;
  title: string;
  lede?: ReactNode;
};

export function PageHead({ line, title, lede }: PageHeadProps) {
  return (
    <header className="page-gutter pt-8 pb-12">
      <p className="numeric text-xs tracking-[0.12em] text-muted uppercase">{line}</p>
      <h1 className="mt-2 text-xl-display font-display">{title}</h1>
      {lede ? <p className="mt-3 max-w-[var(--hp-measure)] text-muted">{lede}</p> : null}
      <hr className="mt-6 border-t border-rule" aria-hidden="true" />
    </header>
  );
}
