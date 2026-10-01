import { useState } from "react";
import { NavLink } from "react-router";

import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/", label: "Index", end: true },
  { to: "/favorites", label: "Your list", end: false },
];

/* One signal per affordance: brightness on hover, the 2px amber underline and
   the caret for "you are here". Never both at once. */
const item =
  "label inline-flex min-h-11 items-center whitespace-nowrap no-underline text-muted hover:text-ink active:translate-y-[var(--hp-pixel)]";
const itemLit = "label inline-flex min-h-11 items-center whitespace-nowrap no-underline text-accent";

/**
 * N7 · Brutal slab. A heavy full-width bar with no rule under it: the only line
 * the header draws is the bronze one beneath the mark itself, so the nav sits on
 * the page rather than closing the top of it. The current page is marked twice —
 * amber underline (colour is never the only signal) and a drawn caret, the way a
 * menu highlights a selection.
 *
 * The bar carries one filled control, and it is the app's own slab button: the
 * same edge, the same 2px shadow, the same padding as every other primary
 * action. Any less padding here and the nav's only call to action would read as
 * a cramped sticker next to the links it sits with.
 */
export function Masthead() {
  const { status, user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="page-gutter bg-paper">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2">
        <NavLink to="/" className="glyph inline-flex min-h-11 items-center text-mark-s whitespace-nowrap no-underline uppercase">
          <span className="border-b-[3px] border-accent pb-0.5">Wizarding Index</span>
        </NavLink>

        <nav aria-label="Primary" className="ms-auto">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {links.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => (isActive ? itemLit : item)}>
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span aria-hidden="true" className="caret me-2 text-accent" />
                      ) : null}
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}

            {status === "authenticated" && user ? (
              <>
                <li className="max-w-[18ch]">
                  <span className="label block truncate text-muted" title={user.email}>
                    {user.email}
                  </span>
                </li>
                <li>
                  <button type="button" onClick={leave} disabled={busy} className={item}>
                    {busy ? "Leaving…" : "Sign out"}
                  </button>
                </li>
              </>
            ) : null}

            {status === "anonymous" ? (
              <>
                <li>
                  <NavLink to="/login" className={({ isActive }) => (isActive ? itemLit : item)}>
                    Sign in
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/register"
                    className="label inline-flex min-h-12 items-center whitespace-nowrap edge border-accent-deep bg-accent-fill px-5 py-2 text-accent-ink no-underline uppercase shadow-[var(--hp-shadow-key)] hover:border-accent active:translate-0.5 active:shadow-none"
                  >
                    Create account
                  </NavLink>
                </li>
              </>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  );
}
