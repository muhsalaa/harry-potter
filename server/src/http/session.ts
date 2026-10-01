import { unauthorized } from "../domain/errors.ts";
import type { User } from "../domain/model.ts";

export const SESSION_COOKIE = "portal_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Who the request is, resolved once before a route runs. */
export type Caller = { user: User | null; token: string | null };

/** The User behind the cookie, or an `unauthorized` failure. */
export function signedIn(caller: Caller): User {
  if (!caller.user) throw unauthorized("Sign in first — this is yours alone.");
  return caller.user;
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }

  return null;
}

/** The cookie a signed-in browser gets back. https is what earns `Secure`. */
export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}${attributes(MAX_AGE_SECONDS, secure)}`;
}

/** The same cookie, emptied: signing out is the browser forgetting it. */
export function clearedSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=${attributes(0, secure)}`;
}

function attributes(maxAge: number, secure: boolean): string {
  return `; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
