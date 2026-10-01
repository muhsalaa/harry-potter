import { and, eq, gt, lte, sql } from "drizzle-orm";

import type { AccountStore } from "../../application/ports.ts";
import type { Db } from "./database.ts";
import { sessions, users } from "./schema.ts";

/** The cookie carries this; the database only ever sees its sha256. */
const newToken = () => randomBytesHex(32);
const hashToken = async (token: string) => hex(await sha256(token));

function randomBytesHex(bytes: number): string {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

function hex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

/** Read by D1's own clock, so a session outlives any clock of ours. */
const NOW = sql`datetime('now')`;
const SESSION_LIFETIME = "+30 days";
const EXPIRES_AT = sql`datetime('now', ${SESSION_LIFETIME})`;

export function createAccountStore(db: Db): AccountStore {
  return {
    async byEmail(email) {
      return (
        (await db
          .select({ id: users.id, email: users.email, passwordHash: users.password_hash })
          .from(users)
          .where(eq(users.email, email))
          .get()) ?? null
      );
    },

    async create(email, passwordHash) {
      const row = await db
        .insert(users)
        .values({ email, password_hash: passwordHash })
        .returning({ id: users.id, email: users.email })
        .get();

      if (!row) throw new Error("The user vanished after being created.");
      return row;
    },

    async openSession(userId) {
      const token = newToken();
      await db
        .insert(sessions)
        .values({ token_hash: await hashToken(token), user_id: userId, expires_at: EXPIRES_AT })
        .run();

      return token;
    },

    async resolveSession(token) {
      return (
        (await db
          .select({ id: users.id, email: users.email })
          .from(sessions)
          .innerJoin(users, eq(users.id, sessions.user_id))
          .where(and(eq(sessions.token_hash, await hashToken(token)), gt(sessions.expires_at, NOW)))
          .get()) ?? null
      );
    },

    async closeSession(token) {
      await db.delete(sessions).where(eq(sessions.token_hash, await hashToken(token))).run();
    },

    /** Expired rows are already unreadable; this is the broom, not the lock. */
    async sweepSessions() {
      const { meta } = await db.delete(sessions).where(lte(sessions.expires_at, NOW)).run();
      return meta.changes;
    },
  };
}
