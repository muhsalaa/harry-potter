import { Link } from "react-router";

type ListToolbarProps = {
  page: number;
  pages: number;
  records: number;
  size: number;
};

/** The pages worth linking to: the ends, the neighbours, and now. */
function windowedPages(page: number, pages: number) {
  const wanted = new Set([1, 2, page - 1, page, page + 1, pages - 1, pages]);
  return [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

const step =
  "label inline-flex min-h-11 items-center whitespace-nowrap text-muted no-underline hover:text-ink active:translate-y-[var(--hp-pixel)]";
const stepOff = "label inline-flex min-h-11 items-center whitespace-nowrap text-rule-strong";

/**
 * Numbered pages inside the URL: deep-linkable, refresh-safe, and honest about
 * a 226-page corpus instead of pretending to be an infinite feed.
 */
export function ListToolbar({ page, pages, records, size }: ListToolbarProps) {
  const first = (page - 1) * size + 1;
  const last = Math.min(page * size, records);
  const shown = windowedPages(page, pages);

  return (
    <nav
      aria-label="Pages of characters"
      className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t-[3px] border-rule-strong pt-2"
    >
      <p className="label numeric text-muted">
        {first}–{last} of {records} · page {page} of {pages}
      </p>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <li>
          {page > 1 ? (
            <Link className={step} to={{ search: `?page=${page - 1}` }} rel="prev">
              ← Prev
            </Link>
          ) : (
            <span className={stepOff}>← Prev</span>
          )}
        </li>

        {shown.map((number, index) => (
          <li key={number} className="flex items-center gap-x-4">
            {index > 0 && number - shown[index - 1] > 1 ? (
              <span aria-hidden="true" className="numeric text-sm text-muted">
                …
              </span>
            ) : null}

            {number === page ? (
              <span
                aria-current="page"
                className="numeric border-b-[3px] border-accent px-1 text-sm text-accent"
              >
                {number}
              </span>
            ) : (
              <Link
                to={{ search: `?page=${number}` }}
                className="numeric inline-flex min-h-11 items-center px-1 text-sm text-muted no-underline hover:text-ink active:translate-y-[var(--hp-pixel)]"
              >
                {number}
              </Link>
            )}
          </li>
        ))}

        <li>
          {page < pages ? (
            <Link className={step} to={{ search: `?page=${page + 1}` }} rel="next">
              Next →
            </Link>
          ) : (
            <span className={stepOff}>Next →</span>
          )}
        </li>
      </ul>
    </nav>
  );
}
