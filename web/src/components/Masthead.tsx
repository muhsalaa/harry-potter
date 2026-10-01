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
 * N7 · Brutal slab. A heavy bar with no rule under it: the only line the header
 * draws is the bronze one beneath the mark itself, so the nav sits on the page
 * rather than closing the top of it. The current page is marked twice — amber
 * underline (colour is never the only signal) and a drawn caret, the way a menu
 * highlights a selection.
 *
 * Two things share this bar, and on a phone they are two rows: the mark alone,
 * then destinations on the left and the account on the right. Four affordances
 * in one wrapped run — Index, Your list, an email address and Sign out — read as
 * a queue of unrelated words, which is what the phone was showing. From `sm` up
 * the same pieces sit on one line with the mark.
 *
 * One account affordance at a time on a phone: two destinations, a sign-in link
 * and a filled button do not fit across 320–390px without wrapping. The button
 * takes the slot, and sign-in keeps its two other doors — the create-account page
 * and the list's own prompt — plus this bar from `sm` up.
 *
 * The bar carries one filled control, and it is the app's own slab button: the
 * same edge, the same 2px shadow, the same padding as every other primary
 * action.
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
      <div className="flex flex-wrap items-center gap-x-6 py-2">
        <NavLink to="/" className="glyph inline-flex min-h-11 items-center text-mark-s whitespace-nowrap no-underline uppercase">
          <span className="border-b-[3px] border-accent pb-0.5">Wizarding Index</span>
        </NavLink>

        {/* Its own row on a phone, tucked in beside the mark from sm up. */}
        <nav
          aria-label="Primary"
          className="ms-auto flex w-full items-center gap-x-5 sm:w-auto sm:gap-x-6"
        >
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:gap-x-6">
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
          </ul>

          {/* The account stands apart from the destinations, and holds the right edge. */}
          <div className="ms-auto flex items-center gap-x-5 sm:ms-0">
            {status === "authenticated" && user ? (
              <>
                {/* A desktop courtesy: on a phone the address is one more word in
                    a row that has no space for it, and the reader knows who they are. */}
                <span className="label hidden max-w-[18ch] truncate text-muted sm:block" title={user.email}>
                  {user.email}
                </span>
                <button type="button" onClick={leave} disabled={busy} className={item}>
                  {busy ? "Leaving…" : "Sign out"}
                </button>
              </>
            ) : null}

            {status === "anonymous" ? (
              <>
                {/* Visibility lives on a wrapper: the link's own classes set
                    `inline-flex`, and two base display utilities on one element
                    resolve by stylesheet order, not by the order they are written. */}
                <span className="hidden sm:block">
                  <NavLink to="/login" className={({ isActive }) => (isActive ? itemLit : item)}>
                    Sign in
                  </NavLink>
                </span>
                <NavLink
                  to="/register"
                  className="label inline-flex min-h-12 items-center whitespace-nowrap edge border-accent-deep bg-accent-fill px-4 py-2 text-accent-ink no-underline uppercase shadow-[var(--hp-shadow-key)] hover:border-accent active:translate-0.5 active:shadow-none sm:px-5"
                >
                  Create account
                </NavLink>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
