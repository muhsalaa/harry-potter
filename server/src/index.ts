import { createServices } from "./application/services.ts";
import { createApp } from "./http/app.ts";
import { scryptPasswords } from "./infrastructure/crypto/passwords.ts";
import { createPotterDbCatalog } from "./infrastructure/potterdb/catalog.ts";
import { createAccountStore } from "./infrastructure/sqlite/account-store.ts";
import { createCharacterStore } from "./infrastructure/sqlite/character-store.ts";
import {
  appliedMigrations,
  DB_PATH,
  migrateDatabase,
  openDatabase,
} from "./infrastructure/sqlite/database.ts";
import { createPersonalStore } from "./infrastructure/sqlite/personal-store.ts";

/** The composition root: the only place that chooses an adapter. */
const db = openDatabase();
const applied = migrateDatabase(db);
const accounts = createAccountStore(db);
const expired = accounts.sweepSessions();

const services = createServices({
  catalog: createPotterDbCatalog(),
  characters: createCharacterStore(db),
  accounts,
  personal: createPersonalStore(db),
  passwords: scryptPasswords,
  migrations: { applied: () => appliedMigrations(db) },
});

const port = Number(process.env.PORT ?? 3000);

createApp(services).listen(port, () => {
  const suffix = applied.length ? ` — applied ${applied.join(", ")}` : "";
  const swept = expired ? ` — swept ${expired} expired session(s)` : "";
  console.log(`api listening on http://localhost:${port}\ndatabase: ${DB_PATH}${suffix}${swept}`);
});
