-- 006 · authentication moves to Better Auth.
--
-- Its four tables are its own shape, not ours: uuid text ids, timestamps as
-- integer milliseconds, and a password hash that lives in `account` rather than
-- on the user. `rateLimit` is only written because rate limiting is told to
-- keep its counters in the database — memory resets with every isolate.
--
-- `favorites` and `notes` pointed at our old integer `users.id`, so their
-- `user_id` is rebuilt as text here. SQLite cannot retype a column in place, and
-- the rows they hold belonged to accounts that no longer exist: the tables are
-- recreated empty, and the old `users`/`sessions` are dropped with them.

CREATE TABLE user (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL,
  image         TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);

CREATE TABLE session (
  id        TEXT PRIMARY KEY,
  token     TEXT NOT NULL UNIQUE,
  userId    TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  expiresAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX session_userId ON session (userId);

CREATE TABLE account (
  id                     TEXT PRIMARY KEY,
  providerId             TEXT NOT NULL,
  accountId              TEXT NOT NULL,
  userId                 TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  password               TEXT,
  accessToken            TEXT,
  refreshToken           TEXT,
  idToken                TEXT,
  accessTokenExpiresAt   INTEGER,
  refreshTokenExpiresAt  INTEGER,
  scope                  TEXT,
  createdAt              INTEGER NOT NULL,
  updatedAt              INTEGER NOT NULL
);

CREATE INDEX account_userId ON account (userId);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expiresAt  INTEGER NOT NULL,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);

CREATE TABLE rateLimit (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  count       INTEGER NOT NULL,
  lastRequest INTEGER NOT NULL
);

DROP TABLE favorites;

CREATE TABLE favorites (
  user_id      TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, character_id)
);

CREATE INDEX favorites_user_id ON favorites (user_id, created_at DESC);

DROP TABLE notes;

CREATE TABLE notes (
  user_id      TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, character_id)
);

DROP TABLE sessions;

DROP TABLE users;
