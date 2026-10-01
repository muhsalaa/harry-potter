import type { Services } from "../../application/services.ts";
import type { Route } from "../app.ts";

export function healthRoutes(services: Services): Route[] {
  return [
    {
      method: "GET",
      path: "/api/health",
      handler: async () => Response.json(await services.health.status()),
    },
  ];
}
