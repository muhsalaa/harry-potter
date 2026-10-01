import type { Services } from "../application/services.ts";
import { invalid } from "../domain/errors.ts";
import { failure } from "./errors.ts";
import { authRoutes } from "./routes/auth.ts";
import { characterRoutes } from "./routes/characters.ts";
import { favoriteRoutes } from "./routes/favorites.ts";
import { healthRoutes } from "./routes/health.ts";
import { noteRoutes } from "./routes/notes.ts";
import { SESSION_COOKIE, readCookie } from "./session.ts";
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

/**
 * The transport adapter: it parses requests, resolves the caller once, calls
 * one use case, and hands the result back. Status codes come from the error
 * handler, never from a route.
 */
export function createApp(services: Services): App {
  const routes: Route[] = [
    ...healthRoutes(services),
    ...authRoutes(services),
    ...characterRoutes(services),
    ...favoriteRoutes(services),
    ...noteRoutes(services),
  ];

  return {
    async fetch(request) {
      try {
        const url = new URL(request.url);
        const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

        for (const route of routes) {
          if (route.method !== request.method) continue;

          const params = match(route.path, path);
          if (!params) continue;

          const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);

          return await route.handler({
            request,
            url,
            params,
            services,
            caller: { token, user: token ? await services.accounts.resolve(token) : null },
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
