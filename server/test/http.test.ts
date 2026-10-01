import assert from "node:assert/strict";
import { test } from "node:test";

import { createApp } from "../src/http/app.ts";
import { character, makeWorld } from "./harness.ts";

/**
 * The real handler, called the way the runtime calls it — no socket, no
 * Express. Routing, cookies and status codes are the surface here.
 */
async function serve() {
  const world = await makeWorld([[character()]]);
  const app = createApp(world.services);

  return {
    ...world,
    api: (path: string, init?: RequestInit) =>
      app.fetch(new Request(`https://portal.test${path}`, init)),
    overHttp: (path: string, init?: RequestInit) =>
      app.fetch(new Request(`http://localhost:3000${path}`, init)),
  };
}

const json = (body: unknown, cookie?: string): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});

test("health reports the migrations it booted with", async () => {
  const app = await serve();

  const response = await app.api("/api/health");
  const body = (await response.json()) as { ok: boolean; database: { migrations: number; applied: string[] } };

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.database.migrations, 5);
  assert.deepEqual(body.database.applied, [
    "001-users-and-sessions.sql",
    "002-characters.sql",
    "003-favorites.sql",
    "004-notes.sql",
    "005-page-size-16.sql",
  ]);

  const missing = await app.api("/api/nonesuch");
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "No such endpoint." });

  const trailingSlash = await app.api("/api/health/");
  assert.equal(trailingSlash.status, 200, "a trailing slash is the same path");
});

test("a rejected promise from a route is answered, not swallowed", async () => {
  const app = await serve();

  const refused = await app.api(
    "/api/auth/register",
    json({ email: "not-an-address", password: "expelliarmus42" }),
  );

  assert.equal(refused.status, 400);
  assert.deepEqual(await refused.json(), {
    error: "That email address is not one an address could have.",
  });
});

test("a body that is not JSON is the caller's mistake, not ours", async () => {
  const app = await serve();

  const broken = await app.api("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not json",
  });

  assert.equal(broken.status, 400);
  assert.deepEqual(await broken.json(), { error: "That body is not JSON." });
});

test("register hands out a cookie, and the cookie is who you are", async () => {
  const app = await serve();

  const registered = await app.api(
    "/api/auth/register",
    json({ email: "Salma@Example.test", password: "expelliarmus42" }),
  );
  assert.equal(registered.status, 201);
  assert.deepEqual(await registered.json(), { user: { id: 1, email: "salma@example.test" } });

  const cookie = registered.headers.getSetCookie()[0].split(";")[0];
  assert.match(cookie, /^portal_session=[0-9a-f]{64}$/);
  assert.ok(
    registered.headers.getSetCookie()[0].includes("HttpOnly"),
    "the cookie is not readable by scripts",
  );
  assert.ok(
    registered.headers.getSetCookie()[0].includes("Secure"),
    "the request was https, so the cookie never leaves without Secure",
  );

  const me = await app.api("/api/me", { headers: { cookie } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { user: { id: 1, email: "salma@example.test" } });

  assert.equal((await app.api("/api/me")).status, 401);
  assert.equal((await app.api("/api/favorites")).status, 401);

  const signedOut = await app.api("/api/auth/logout", json({}, cookie));
  assert.equal(signedOut.status, 204);
  assert.match(signedOut.headers.getSetCookie()[0], /Max-Age=0/);
  assert.equal(
    (await app.api("/api/me", { headers: { cookie } })).status,
    401,
    "the cookie died with the session",
  );
});

test("over plain http — how wrangler dev serves it — the cookie drops Secure", async () => {
  const app = await serve();

  const registered = await app.overHttp(
    "/api/auth/register",
    json({ email: "salma@example.test", password: "expelliarmus42" }),
  );
  const cookie = registered.headers.getSetCookie()[0];

  assert.equal(registered.status, 201);
  assert.match(cookie, /^portal_session=[0-9a-f]{64}; Path=\/; HttpOnly; SameSite=Lax/);
  assert.ok(!cookie.includes("Secure"), "a browser would refuse it over http");
  assert.equal((await app.overHttp("/api/me", { headers: { cookie: cookie.split(";")[0] } })).status, 200);
});

test("browsing, favoriting and noting a character over HTTP", async () => {
  const app = await serve();

  const anonymous = await app.api("/api/characters?page=1");
  const cold = (await anonymous.json()) as { data: { id: number; viewer?: unknown }[]; meta: { cached: boolean } };
  assert.equal(cold.meta.cached, false);
  assert.equal(cold.data[0].viewer, undefined);

  const warm = await app.api("/api/characters?page=1");
  assert.equal(((await warm.json()) as { meta: { cached: boolean } }).meta.cached, true);

  const registered = await app.api(
    "/api/auth/register",
    json({ email: "salma@example.test", password: "expelliarmus42" }),
  );
  const cookie = registered.headers.getSetCookie()[0].split(";")[0];
  const id = cold.data[0].id;

  const favorited = await app.api(`/api/favorites/${id}`, json({}, cookie));
  assert.deepEqual(await favorited.json(), { favorited: true });

  const listed = (await (await app.api("/api/favorites", { headers: { cookie } })).json()) as {
    data: { slug: string; viewer?: { favorited: boolean; hasNote: boolean } }[];
  };
  assert.equal(listed.data.length, 1);
  assert.equal(listed.data[0].slug, "harry-potter");
  assert.deepEqual(listed.data[0].viewer, { favorited: true, hasNote: false });

  const saved = await app.api(`/api/notes/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ body: "  the chosen one  " }),
  });
  assert.equal(saved.status, 200);
  assert.equal(((await saved.json()) as { note: { body: string } }).note.body, "the chosen one");

  const empty = await app.api(`/api/notes/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ body: "   " }),
  });
  assert.equal(empty.status, 400);
  assert.deepEqual(await empty.json(), {
    error: "An empty note is not worth keeping. Write something first.",
  });

  const noSuchCharacter = await app.api("/api/favorites/9999", json({}, cookie));
  assert.equal(noSuchCharacter.status, 404);
});
