import { Outlet } from "react-router";

import { Masthead } from "./components/Masthead";
import { SiteFooter } from "./components/SiteFooter";

/**
 * The shell every route renders inside. This file owns the page column, the
 * nav, the footer and the skip link so no two feature slices ever need to edit
 * it. The column is capped and centred here rather than per page: on a wide
 * screen the paper simply continues either side of it.
 */
export function App() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[var(--hp-page-max)] flex-col">
      <a
        href="#main"
        className="label page-gutter sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[var(--hp-z-sticky)] focus:edge focus:border-accent focus:bg-paper-2 focus:py-2"
      >
        Skip to content
      </a>

      <Masthead />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
