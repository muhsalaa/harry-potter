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
      className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-3"
    >
      <p className="numeric text-xs tracking-[0.1em] text-muted uppercase">
        {first}–{last} of {records} · page {page} of {pages}
      </p>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <li>
          {page > 1 ? (
            <Link
              className="numeric text-xs tracking-[0.1em] whitespace-nowrap uppercase underline-offset-2 hover:underline"
              to={{ search: `?page=${page - 1}` }}
              rel="prev"
            >
              Prev
            </Link>
          ) : (
            <span className="numeric text-xs tracking-[0.1em] text-rule-strong uppercase">Prev</span>
          )}
        </li>

        {shown.map((number, index) => (
          <li key={number} className="flex items-center gap-3">
            {index > 0 && number - shown[index - 1] > 1 ? (
              <span aria-hidden="true" className="numeric text-xs text-muted">
                …
              </span>
            ) : null}

            {number === page ? (
              <span
                aria-current="page"
                className="numeric border-b border-accent text-xs tracking-[0.1em] text-accent-deep"
              >
                {number}
              </span>
            ) : (
              <Link
                to={{ search: `?page=${number}` }}
                className="numeric text-xs tracking-[0.1em] no-underline underline-offset-2 hover:underline"
              >
                {number}
              </Link>
            )}
          </li>
        ))}

        <li>
          {page < pages ? (
            <Link
              className="numeric text-xs tracking-[0.1em] whitespace-nowrap uppercase underline-offset-2 hover:underline"
              to={{ search: `?page=${page + 1}` }}
              rel="next"
            >
              Next
            </Link>
          ) : (
            <span className="numeric text-xs tracking-[0.1em] text-rule-strong uppercase">Next</span>
          )}
        </li>
      </ul>
    </nav>
  );
}
