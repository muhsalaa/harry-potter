/**
 * Ft2 · Inline-rule single line. A footer closes a page; it does not catalogue
 * a sitemap. This one carries the two things that must be said: where the data
 * comes from, and what this is not.
 */
export function SiteFooter() {
  return (
    <footer
      className="page-gutter mt-16 pb-8"
      style={{ paddingBottom: "max(var(--hp-space-2xl), env(safe-area-inset-bottom))" }}
    >
      <hr className="border-t border-rule" aria-hidden="true" />
      <p className="numeric mt-3 text-center text-xs text-muted">
        Character data from PotterDB · Not affiliated with Warner Bros. Discovery ·
        A study project
      </p>
    </footer>
  );
}
