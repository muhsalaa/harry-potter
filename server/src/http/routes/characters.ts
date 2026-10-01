import type { Services } from "../../application/services.ts";
import type { Route } from "../app.ts";

function pageNumber(raw: string | null): number {
  const requested = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(requested) && requested > 0 ? requested : 1;
}

export function characterRoutes(services: Services): Route[] {
  return [
    {
      method: "GET",
      path: "/api/characters",
      handler: async ({ url, caller }) => {
        const page = pageNumber(url.searchParams.get("page"));
        return Response.json(await services.characters.list(page, caller.user?.id ?? null));
      },
    },
    {
      method: "GET",
      path: "/api/characters/:slug",
      handler: async ({ params, caller }) =>
        Response.json({ data: await services.characters.bySlug(params.slug ?? "", caller.user?.id ?? null) }),
    },
  ];
}
