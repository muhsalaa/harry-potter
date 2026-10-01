import { useState } from "react";
import { NavLink } from "react-router";

import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/", label: "Browse", end: true },
  { to: "/favorites", label: "Favorites", end: false },
];

const quiet =
  "numeric text-sm tracking-[0.1em] whitespace-nowrap uppercase no-underline underline-offset-2";
const lit = `${quiet} text-accent-deep underline`;
// One hover signal per element: the underline. Earlier drafts also shifted the
// colour, which is two signals on one affordance (slop gate 13).
const dim = `${quiet} text-muted hover:underline active:text-accent-deep`;

/**
 * N6 · Newspaper masthead — centred wordmark, thin issue line in mono, link row
 * beneath, double rule closing the block. The app is framed as an issue rather
 * than as a product, because it is an index.
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
    <header className="page-gutter pt-6 text-center">
      <p className="numeric text-xs tracking-[0.14em] text-muted uppercase">
        No 1 · Characters · from PotterDB
      </p>

      <NavLink to="/" className="mt-2 block no-underline">
        <span className="font-display text-wordmark leading-none tracking-[0.01em] uppercase">
          Wizarding Index
        </span>
      </NavLink>

      <nav aria-label="Primary" className="mt-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {links.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? lit : dim)}>
                {label}
              </NavLink>
            </li>
          ))}

          {status === "authenticated" && user ? (
            <>
              <li>
                {/* The address is a fact about the session, not a destination. */}
                <span className="numeric text-sm text-muted">{user.email}</span>
              </li>
              <li>
                <button type="button" onClick={leave} disabled={busy} className={dim}>
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </li>
            </>
          ) : null}

          {status === "anonymous" ? (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => (isActive ? lit : dim)}>
                  Sign in
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => (isActive ? lit : dim)}>
                  Create account
                </NavLink>
              </li>
            </>
          ) : null}
        </ul>
      </nav>

      <hr className="rule-double mt-4" aria-hidden="true" />
    </header>
  );
}
