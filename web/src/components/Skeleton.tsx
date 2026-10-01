/**
 * Loading, drawn in the shape of what is coming. Three pieces:
 *
 * - `Bar` is one grey block. It flickers between two paper tones on the sprite
 *   easing — the same `hp-flicker` the candles use — because a blurred shimmer
 *   gradient would be the one soft thing on a page made of hard edges. Under
 *   `prefers-reduced-motion` the global rule stops it after a single frame, which
 *   is the intent: a still block still says "a value is on its way".
 *
 * - `NumeralSkeleton` and `CharacterGridSkeleton` copy the real furniture of
 *   the index — the corpus count, the 4-up grid, the framed plate, the two-line
 *   name, the reserved meta line — so nothing jumps when the characters land.
 *   They are `aria-hidden`: a screen reader gets one polite sentence from the
 *   page around them instead of sixteen empty tiles.
 *
 * - `RecordSkeleton` does the same for one character's spec sheet.
 */

const TILE = "edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]";

/** One block. Everything else here is a composition of these. */
export function Bar({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

/** The page's own announcement — the skeleton itself says nothing to a reader. */
export function LoadingLine({ children }: { children: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

/**
 * The count sits at the numeral's own scale, so the masthead keeps its height
 * while the number is on its way — a skeleton sized in the reader's font-size
 * would reserve 10px where 65px of glyph is coming.
 */
export function NumeralSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="skeleton block h-[0.68em] w-[4.6ch] font-display text-numeral leading-none"
    />
  );
}

/** A page of tiles, in the grid the real ones land in. */
export function CharacterGridSkeleton({ count = 16 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="min-w-0">
          <div className={TILE}>
            <div className="skeleton aspect-3/4" />
          </div>

          <div className="font-display min-h-[2.5em] text-md leading-tight">
            <Bar className="mt-1.5 h-2.5 w-4/5" />
            <Bar className="mt-1.5 h-2.5 w-3/5" />
          </div>

          <span className="label mt-1 flex min-h-5 items-center">
            <Bar className="h-2 w-14" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The record page: its plate on the left, its ruled rows on the right. */
export function RecordSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="page-gutter grid gap-8 pb-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div aria-hidden="true">
        <div className={TILE}>
          <div className="skeleton aspect-3/4" />
        </div>
      </div>

      <div className="min-w-0 border-t-[3px] border-rule-strong" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="grid gap-x-6 gap-y-2 border-b-[var(--hp-pixel)] border-rule py-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]"
          >
            <Bar className="h-3 w-24" />
            <Bar className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Three lines of prose, where a lede or a form is still arriving. */
export function ProseSkeleton({ lines = 2, className = "" }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-5/6", "w-2/3"];

  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Bar key={index} className={`h-3 ${widths[index % widths.length]}${index ? " mt-2" : ""}`} />
      ))}
    </div>
  );
}
