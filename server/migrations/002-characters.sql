-- Ticket 02 · the local mirror of PotterDB characters.
--
-- `id` is ours; `potterdb_id` is theirs. Favorites and notes point at our id,
-- so the app's schema does not depend on a third party's identifiers.
--
-- `list_page` / `list_index` remember where a character sits in PotterDB's
-- stable page order, which is what makes a page cacheable on first view
-- (ADR-0001) instead of syncing all 5410 records up front.
CREATE TABLE characters (
  id               INTEGER PRIMARY KEY,
  potterdb_id      TEXT NOT NULL UNIQUE,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  image            TEXT,
  house            TEXT,
  blood_status     TEXT,
  species          TEXT,
  gender           TEXT,
  born             TEXT,
  died             TEXT,
  eye_color        TEXT,
  hair_color       TEXT,
  skin_color       TEXT,
  height           TEXT,
  weight           TEXT,
  nationality      TEXT,
  marital_status   TEXT,
  patronus         TEXT,
  boggart          TEXT,
  animagus         TEXT,
  alias_names      TEXT NOT NULL DEFAULT '[]',
  family_members   TEXT NOT NULL DEFAULT '[]',
  jobs             TEXT NOT NULL DEFAULT '[]',
  romances         TEXT NOT NULL DEFAULT '[]',
  titles           TEXT NOT NULL DEFAULT '[]',
  wands            TEXT NOT NULL DEFAULT '[]',
  wiki             TEXT,
  list_page        INTEGER,
  list_index       INTEGER,
  cached_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX characters_list_page ON characters (list_page);

-- One row: how many characters the corpus holds and how many pages that is.
-- Counts come from PotterDB's own pagination meta, never from a guess.
CREATE TABLE corpus (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  records    INTEGER NOT NULL,
  pages      INTEGER NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);
