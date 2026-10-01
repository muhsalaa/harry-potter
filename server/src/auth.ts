import { lt } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { MIN_PASSWORD } from "./domain/rules.ts";
import { openDatabase } from "./infrastructure/d1/database.ts";
import { account, rateLimit, session, user, verification } from "./infrastructure/d1/schema.ts";

/** What authentication needs from the environment: a database, and the secret. */
export type AuthBindings = Pick<Env, "DB"> & { BETTER_AUTH_SECRET: string };

/** Where the browser is when the API is not: vite serves the app on 5173 and proxies /api. */
const DEV_ORIGIN = "http://localhost:5173";

const isLocal = (origin: string) => {
  const { hostname } = new URL(origin);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
};

/**
 * Authentication, as Better Auth's own endpoints rather than ours. It is built
 * per request because a Worker has no boot and its bindings arrive with the
 * request — and that is also what makes the address configuration-free: the
 * origin comes from the URL the request was addressed to, so workers.dev, a
 * custom domain and localhost all work without a var to keep in step.
 *
 * The trusted origin is derived from the request's own URL, never from its
 * `Origin` header: the header is the thing being checked, so trusting it would
 * be trusting the attacker. A browser on another site can only reach us by
 * addressing us, and then the two disagree — which is the 403 that keeps a
 * stranger's page from signing anyone in.
 *
 * What Better Auth owns: the password hash (scrypt, in `account`), the session
 * rows and the cookie (`better-auth.session_token`, HttpOnly, SameSite=Lax,
 * Secure whenever the request came over https), the CSRF origin check, and the
 * request rate limits.
 */
export function createAuth(env: AuthBindings, request: Request) {
  const origin = new URL(request.url).origin;
  const secret: string = env.BETTER_AUTH_SECRET;

  return betterAuth({
    database: drizzleAdapter(openDatabase(env.DB), {
      provider: "sqlite",
      schema: { user, session, account, verification, rateLimit },
    }),

    secret,
    baseURL: origin,
    trustedOrigins: isLocal(origin) ? [origin, DEV_ORIGIN] : [origin],

    /** The one door: an email address and a password. No social, no email flows. */
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD,
    },

    /** A month, refreshed daily — what the hand-written session cookie used to be. */
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    /**
     * Counters live in D1, not in isolate memory: a rate limit that forgets
     * every time an isolate is recycled is not a rate limit. Sign-in and
     * sign-up are the two doors worth watching.
     */
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/api/auth/sign-in/email": { window: 60, max: 10 },
        "/api/auth/sign-up/email": { window: 60, max: 5 },
      },
    },

    /** uuids, so an id in a log line or a row is recognisable as one. */
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Sessions expire by their own clock; the sweep only takes the dead rows away. */
export async function sweepExpiredSessions(env: { DB: D1Database }): Promise<void> {
  await openDatabase(env.DB)
    .delete(session)
    .where(lt(session.expiresAt, new Date()))
    .run();
}
