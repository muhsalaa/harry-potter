import { createHash, randomBytes } from "node:crypto";

import type { AccountStore } from "../../application/ports.ts";
import type { StoredUser, User } from "../../domain/model.ts";
import type { Db } from "./database.ts";

/** The cookie carries this; the database only ever sees its sha256. */
const newToken = () => randomBytes(32).toString("hex");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const SESSION_LIFETIME = "+30 days";

export function createAccountStore(db: Db): AccountStore {
  const selectByEmail = db.prepare(
    "SELECT id, email, password_hash AS passwordHash FROM users WHERE email = ?",
  );
  const selectSession = db.prepare(
    `SELECT u.id, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
  );

  return {
    byEmail: (email) => (selectByEmail.get(email) as StoredUser | undefined) ?? null,

    create: (email, passwordHash) => {
      const { lastInsertRowid } = db
        .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email, passwordHash);

      return { id: Number(lastInsertRowid), email };
    },

    openSession: (userId) => {
      const token = newToken();
      db.prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at)
         VALUES (?, ?, datetime('now', ?))`,
      ).run(hashToken(token), userId, SESSION_LIFETIME);

      return token;
    },

    resolveSession: (token) => (selectSession.get(hashToken(token)) as User | undefined) ?? null,

    closeSession: (token) => {
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    },

    sweepSessions: () =>
      db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run().changes,
  };
}
