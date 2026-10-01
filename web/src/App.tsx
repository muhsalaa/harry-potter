import { Outlet } from "react-router";

import { Masthead } from "./components/Masthead";
import { SiteFooter } from "./components/SiteFooter";

/**
 * The shell every route renders inside. This file owns the nav, the footer and
 * the skip link so no two feature slices ever need to edit it.
 */
export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="label page-gutter sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[var(--hp-z-sticky)] focus:border-[var(--hp-pixel)] focus:border-accent focus:bg-paper-2 focus:py-2"
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
