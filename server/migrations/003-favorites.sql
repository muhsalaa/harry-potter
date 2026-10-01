-- Ticket 04 · a private mark on a Character. Never counted, never listed for
-- anyone but its owner (ADR-0002).
CREATE TABLE favorites (
  user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, character_id)
);

CREATE INDEX favorites_user_id ON favorites (user_id, created_at DESC);
