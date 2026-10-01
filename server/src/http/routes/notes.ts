import type { Services } from "../../application/services.ts";
import type { Route } from "../app.ts";
import { signedIn } from "../session.ts";

/** Anything that is not a number reads as "no such character", never as 0. */
function characterId(raw: string | undefined): number | null {
  const id = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(id) ? id : null;
}

export function noteRoutes(services: Services): Route[] {
  return [
    {
      method: "GET",
      path: "/api/notes/:characterId",
      handler: async ({ params, caller }) =>
        Response.json(
          await services.personal.readNote(signedIn(caller).id, characterId(params.characterId)),
        ),
    },
    {
      method: "PUT",
      path: "/api/notes/:characterId",
      handler: async ({ params, caller, json }) => {
        const body = await json();

        return Response.json(
          await services.personal.saveNote(
            signedIn(caller).id,
            characterId(params.characterId),
            typeof body.body === "string" ? body.body : "",
          ),
        );
      },
    },
  ];
}
