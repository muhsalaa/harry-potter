import { createServices } from "./application/services.ts";
import type { Services } from "./application/services.ts";
import { createAuth, sweepExpiredSessions } from "./auth.ts";
import type { Auth } from "./auth.ts";
import { createApp } from "./http/app.ts";
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
    personal: createPersonalStore(db),
    migrations: { applied: () => appliedMigrations(db) },
  });
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const auth: Auth = createAuth(env, request);
    return createApp({ services: createServicesFrom(env), auth }).fetch(request);
  },

  /** Nothing to do but take the rows away: an expired session cannot be read. */
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(sweepExpiredSessions(env));
  },
} satisfies ExportedHandler<Env>;
