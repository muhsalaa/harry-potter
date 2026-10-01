import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, lte, sql } from "drizzle-orm";

import type { AccountStore } from "../../application/ports.ts";
import type { StoredUser, User } from "../../domain/model.ts";
import type { Db } from "./database.ts";
import { sessions, users } from "./schema.ts";

/** The cookie carries this; the database only ever sees its sha256. */
const newToken = () => randomBytes(32).toString("hex");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Read by SQLite's own clock, so a session outlives any clock of ours. */
const NOW = sql`datetime('now')`;
const SESSION_LIFETIME = "+30 days";
const EXPIRES_AT = sql`datetime('now', ${SESSION_LIFETIME})`;

export function createAccountStore(db: Db): AccountStore {
  const byEmail = (email: string): StoredUser | null =>
    db
      .select({ id: users.id, email: users.email, passwordHash: users.password_hash })
      .from(users)
      .where(eq(users.email, email))
      .get() ?? null;

  const resolveSession = (token: string): User | null =>
    db
      .select({ id: users.id, email: users.email })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.user_id))
      .where(and(eq(sessions.token_hash, hashToken(token)), gt(sessions.expires_at, NOW)))
      .get() ?? null;

  return {
    byEmail,

    create: (email, passwordHash) =>
      db
        .insert(users)
        .values({ email, password_hash: passwordHash })
        .returning({ id: users.id, email: users.email })
        .get(),

    openSession: (userId) => {
      const token = newToken();
      db.insert(sessions)
        .values({ token_hash: hashToken(token), user_id: userId, expires_at: EXPIRES_AT })
        .run();

      return token;
    },

    resolveSession,

    closeSession: (token) => {
      db.delete(sessions).where(eq(sessions.token_hash, hashToken(token))).run();
    },

    sweepSessions: () => db.delete(sessions).where(lte(sessions.expires_at, NOW)).run().changes,
  };
}
