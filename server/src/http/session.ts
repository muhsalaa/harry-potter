import { unauthorized } from "../domain/errors.ts";
import type { User } from "../domain/model.ts";

/**
 * Who the request is, resolved once before a route runs. The cookie, the
 * session row and its expiry are Better Auth's business — by the time a route
 * sees a Caller, the question is already answered.
 */
export type Caller = { user: User | null };

/** The User behind the session, or an `unauthorized` failure. */
export function signedIn(caller: Caller): User {
  if (!caller.user) throw unauthorized("Sign in first — this is yours alone.");
  return caller.user;
}
