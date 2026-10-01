import type { NextFunction, Request, RequestHandler, Response } from "express";

import { unauthorized } from "../domain/errors.ts";
import type { User } from "../domain/model.ts";

export const SESSION_COOKIE = "portal_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type Caller = { user: User | null; token: string | null };

/** Filled in by attachUser; a request that never passed through it reads as anonymous. */
const callers = new WeakMap<Request, Caller>();

/**
 * Resolves the cookie to a User on every request. An absent cookie is not an
 * error: most of the corpus is public.
 */
export function attachUser(resolve: (token: string) => User | null): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readCookie(req, SESSION_COOKIE);
    callers.set(req, { user: token ? resolve(token) : null, token });
    next();
  };
}

export function caller(req: Request): Caller {
  return callers.get(req) ?? { user: null, token: null };
}

/** The User behind the cookie, or an `unauthorized` failure. */
export function signedIn(req: Request): User {
  const { user } = caller(req);
  if (!user) throw unauthorized("Sign in first — this is yours alone.");
  return user;
}

function cookieAttributes(maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(res: Response, token: string): void {
  res.append("Set-Cookie", `${SESSION_COOKIE}=${token}${cookieAttributes(MAX_AGE_SECONDS)}`);
}

export function clearSessionCookie(res: Response): void {
  res.append("Set-Cookie", `${SESSION_COOKIE}=${cookieAttributes(0)}`);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }

  return null;
}
