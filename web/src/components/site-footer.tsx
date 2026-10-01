/**
 * Ft5 · Statement. The page closes with one sentence rather than a sitemap,
 * then a single rule carrying what must be said: where the data comes from and
 * what this is not.
 *
 * The opening rule lives on an inner box, not on the footer itself: a border on
 * the padded element spans its padding too, which would run the line one gutter
 * past every other rule on the page.
 */
export function SiteFooter() {
  return (
    <footer
      className="page-gutter mt-24"
      style={{ paddingBottom: "max(var(--hp-space-2xl), env(safe-area-inset-bottom))" }}
    >
      <div className="border-t-[3px] border-rule-strong pt-12">
        <p className="font-display text-display-s max-w-[26ch] leading-[1.04]">
          Pick a name. The tower keeps the rest.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t-[var(--hp-pixel)] border-rule pt-4">
          <span className="glyph text-sm uppercase">Wizarding Index</span>
          <p className="label text-muted">
            Character data from PotterDB · Not affiliated with Warner Bros. Discovery
          </p>
        </div>
      </div>
    </footer>
  );
}
