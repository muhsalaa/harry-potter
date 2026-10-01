/** An account holder. Sessions stand for one of these. */
export type User = { id: number; email: string };

/** A User plus the credential that never leaves the application layer. */
export type StoredUser = User & { passwordHash: string };

/** What a signed-in viewer is entitled to see about one Character. */
export type ViewerState = { favorited: boolean; hasNote: boolean };

/** A User's private text about one Character: no history, no delete. */
export type Note = { body: string; updatedAt: string };

/** PotterDB's own pagination counts, mirrored once so pages can be bounded. */
export type Corpus = { records: number; pages: number; fetchedAt: string };

/** One row of the migration ledger, as the health report reads it. */
export type MigrationRecord = { name: string; appliedAt: string };
