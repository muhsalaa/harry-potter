import { createServices } from "./application/services.ts";
import type { Services } from "./application/services.ts";
import { createApp } from "./http/app.ts";
import { scryptPasswords } from "./infrastructure/crypto/passwords.ts";
import { createAccountStore } from "./infrastructure/d1/account-store.ts";
import { createCharacterStore } from "./infrastructure/d1/character-store.ts";
import { appliedMigrations, openDatabase } from "./infrastructure/d1/database.ts";
import { createPersonalStore } from "./infrastructure/d1/personal-store.ts";
import { createPotterDbCatalog } from "./infrastructure/potterdb/catalog.ts";

/**
 * The composition root: the only place bindings become adapters. It runs per
 * request — a Worker has no boot — and holds nothing between them.
 */
export function createServicesFrom(env: Env): Services {
  const db = openDatabase(env.DB);

  return createServices({
    catalog: createPotterDbCatalog(env.POTTERDB_BASE_URL),
    characters: createCharacterStore(db),
    accounts: createAccountStore(db),
    personal: createPersonalStore(db),
    passwords: scryptPasswords,
    migrations: { applied: () => appliedMigrations(db) },
  });
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createApp(createServicesFrom(env)).fetch(request);
  },

  /** Sessions expire by their own clock; the sweep only takes the rows away. */
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(createAccountStore(openDatabase(env.DB)).sweepSessions());
  },
} satisfies ExportedHandler<Env>;
