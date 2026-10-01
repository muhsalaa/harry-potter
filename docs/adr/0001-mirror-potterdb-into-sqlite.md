# Character data is mirrored from PotterDB into our own SQLite table

Character attributes are owned by PotterDB and read live, but the backend caches each page it serves into a local `characters` table, upserting on the PotterDB id, and the frontend only ever talks to our own backend.
We do this because Favorites and Notes need to reference a Character row we own rather than a third-party UUID, because a local copy is what makes our own filtering and pagination possible later, and because it keeps one origin for cookies and CORS. Verified enabler: PotterDB's pagination is stable across repeat requests, so pages can be cached lazily instead of bulk-syncing all 5410 records.

## Considered Options

- **Frontend calls PotterDB directly, backend stores only Favorites/Notes** — less code, but forever couples our schema to third-party identifiers and spreads the client across two origins.
- **Bulk sync all 5410 characters on startup** — unnecessary; nothing here needs the whole corpus warm.
