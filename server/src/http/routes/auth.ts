import type { Services } from "../../application/services.ts";
import type { Route } from "../app.ts";
import { clearedSessionCookie, sessionCookie, signedIn } from "../session.ts";

export function authRoutes(services: Services): Route[] {
  /** A cookie over http is not a secure cookie; over https it always is. */
  const secure = (url: URL) => url.protocol === "https:";

  return [
    {
      method: "POST",
      path: "/api/auth/register",
      handler: async ({ url, json }) => {
        const body = await json();
        const { user, token } = await services.accounts.register(
          String(body.email ?? ""),
          String(body.password ?? ""),
        );

        return Response.json(
          { user },
          { status: 201, headers: { "Set-Cookie": sessionCookie(token, secure(url)) } },
        );
      },
    },
    {
      method: "POST",
      path: "/api/auth/login",
      handler: async ({ url, json }) => {
        const body = await json();
        const { user, token } = await services.accounts.login(
          String(body.email ?? ""),
          String(body.password ?? ""),
        );

        return Response.json(
          { user },
          { headers: { "Set-Cookie": sessionCookie(token, secure(url)) } },
        );
      },
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      handler: async ({ url, caller }) => {
        await services.accounts.logout(caller.token);

        return new Response(null, {
          status: 204,
          headers: { "Set-Cookie": clearedSessionCookie(secure(url)) },
        });
      },
    },
    {
      method: "GET",
      path: "/api/me",
      handler: async ({ caller }) => Response.json({ user: signedIn(caller) }),
    },
  ];
}
