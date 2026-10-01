import type { Services } from "../application/services.ts";
import type { Auth } from "../auth.ts";
import { invalid } from "../domain/errors.ts";
import { failure } from "./errors.ts";
import { characterRoutes } from "./routes/characters.ts";
import { favoriteRoutes } from "./routes/favorites.ts";
import { healthRoutes } from "./routes/health.ts";
import { noteRoutes } from "./routes/notes.ts";
import { sessionRoutes } from "./routes/session.ts";
import type { Caller } from "./session.ts";

/** Everything a route is handed: the request, who sent it, and the use cases. */
export type Ctx = {
  request: Request;
  url: URL;
  params: Record<string, string>;
  services: Services;
  caller: Caller;
  /** The JSON body, an empty object when there is none. */
  json(): Promise<Record<string, unknown>>;
};

export type Route = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  handler: (ctx: Ctx) => Promise<Response>;
};

export type App = { fetch(request: Request): Promise<Response> };

export type AppDependencies = { services: Services; auth: Auth };

/**
 * The transport adapter: it parses requests, resolves the caller once, calls
 * one use case, and hands the result back. Status codes come from the error
 * handler, never from a route.
 *
 * `/api/auth/*` is not ours: it goes straight to Better Auth's own handler,
 * which owns sign-up, sign-in, sign-out and the cookie that proves them.
 */
export function createApp({ services, auth }: AppDependencies): App {
  const routes: Route[] = [
    ...healthRoutes(services),
    ...sessionRoutes(),
    ...characterRoutes(services),
    ...favoriteRoutes(services),
    ...noteRoutes(services),
  ];

  return {
    async fetch(request) {
      try {
        const url = new URL(request.url);
        const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

        if (path.startsWith("/api/auth/")) return await auth.handler(request);

        for (const route of routes) {
          if (route.method !== request.method) continue;

          const params = match(route.path, path);
          if (!params) continue;

          return await route.handler({
            request,
            url,
            params,
            services,
            caller: await callerOf(auth, request),
            json: () => body(request),
          });
        }

        return Response.json({ error: "No such endpoint." }, { status: 404 });
      } catch (error) {
        return failure(error);
      }
    },
  };
}

/** One session read per request, and only for a route that matched. */
async function callerOf(auth: Auth, request: Request): Promise<Caller> {
  const found = await auth.api.getSession({ headers: request.headers });

  return { user: found ? { id: found.user.id, email: found.user.email, name: found.user.name } : null };
}

/** Segments match literally, or capture with a leading colon. */
function match(pattern: string, path: string): Record<string, string> | null {
  const wanted = pattern.split("/");
  const given = path.split("/");
  if (wanted.length !== given.length) return null;

  const params: Record<string, string> = {};

  for (const [index, segment] of wanted.entries()) {
    const value = given[index] ?? "";

    if (segment.startsWith(":")) params[segment.slice(1)] = decodeURIComponent(value);
    else if (segment !== value) return null;
  }

  return params;
}

/** A body that is not JSON is the caller's mistake, and reads as a 400. */
async function body(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text) return {};

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw invalid("That body is not JSON.");
  }
}
