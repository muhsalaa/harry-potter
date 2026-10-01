import type { Route } from "../app.ts";
import { signedIn } from "../session.ts";

/** The only auth endpoint that is ours: who the session says you are. */
export function sessionRoutes(): Route[] {
  return [
    {
      method: "GET",
      path: "/api/me",
      handler: async ({ caller }) => Response.json({ user: signedIn(caller) }),
    },
  ];
}
