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
 * N7 · Brutal slab. A heavy full-width bar on a 3px rule: the pixel aesthetic
 * has no room for soft chrome, so the nav is a rule with things standing on it.
 * The current page is marked twice — amber 2px underline (colour is never the
 * only signal) and a drawn caret, the way a menu highlights a selection.
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
    <header className="page-gutter border-b-[3px] border-rule-strong bg-paper">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-1">
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
                    className="label inline-flex min-h-11 items-center whitespace-nowrap edge border-accent-deep bg-accent-fill px-4 text-accent-ink no-underline uppercase shadow-[var(--hp-shadow-key)] hover:border-accent active:translate-0.5 active:shadow-none"
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
