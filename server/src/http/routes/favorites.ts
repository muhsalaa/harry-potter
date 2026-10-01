import type { Services } from "../../application/services.ts";
import type { Route } from "../app.ts";
import { signedIn } from "../session.ts";

/** Anything that is not a number reads as "no such character", never as 0. */
function characterId(raw: string | undefined): number | null {
  const id = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(id) ? id : null;
}

export function favoriteRoutes(services: Services): Route[] {
  return [
    {
      method: "GET",
      path: "/api/favorites",
      handler: async ({ caller }) =>
        Response.json(await services.personal.listFavorites(signedIn(caller).id)),
    },
    {
      method: "POST",
      path: "/api/favorites/:characterId",
      handler: async ({ params, caller }) =>
        Response.json(
          await services.personal.toggleFavorite(signedIn(caller).id, characterId(params.characterId)),
        ),
    },
  ];
}
