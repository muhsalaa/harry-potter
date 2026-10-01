import { newSessionToken, hashSessionToken, readCookie, SESSION_COOKIE } from "./session.js";

export function findSessionUser(db, token) {
  return (
    db
      .prepare(
        `SELECT u.id, u.email
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
      )
      .get(hashSessionToken(token)) ?? null
  );
}

export function createSession(db, userId) {
  const token = newSessionToken();
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES (?, ?, datetime('now', '+30 days'))`,
  ).run(hashSessionToken(token), userId);

  return token;
}

export function destroySession(db, token) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function deleteExpiredSessions(db) {
  return db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run().changes;
}

/** Resolves the cookie to a User on every request. Absent cookie is not an error. */
export function attachUser(db) {
  return (req, _res, next) => {
    const token = readCookie(req, SESSION_COOKIE);
    req.user = token ? findSessionUser(db, token) : null;
    req.sessionToken = token;
    next();
  };
}

export function requireUser(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Sign in first — this is yours alone." });
    return;
  }
  next();
}
