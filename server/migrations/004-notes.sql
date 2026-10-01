-- Ticket 05 · one private note per User and Character. Re-saving overwrites
-- this row: no history, no second note, no delete.
CREATE TABLE notes (
  user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, character_id)
);
