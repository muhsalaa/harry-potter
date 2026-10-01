import assert from "node:assert/strict";
import { test } from "node:test";

import { createApp } from "../src/http/app.ts";
import { character, makeWorld } from "./harness.ts";

/**
 * The real handler, called the way the runtime calls it — no socket, no
 * Express. Routing, cookies and status codes are the surface here.
 *
 * Requests are made from the origin a browser would be on, which is also the
 * one Better Auth trusts: vite on :5173, proxying /api. Anything else is a
 * different site, and Better Auth's CSRF check answers it with a 403.
 */
async function serve() {
  const world = await makeWorld([[character()]]);
  const app = createApp({ services: world.services, auth: world.auth });

  return {
    ...world,
    api: (path: string, init?: RequestInit) =>
      app.fetch(new Request(`http://localhost:5173${path}`, init)),
  };
}

/**
 * A browser's own POST: a content type, a cookie when there is one, and the
 * Origin header Better Auth checks before it will change anything.
 */
const json = (body: unknown, cookie?: string): RequestInit => ({
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: "http://localhost:5173",
    ...(cookie ? { cookie } : {}),
  },
  body: JSON.stringify(body),
});

const signUp = (email: string, password = "expelliarmus42"): RequestInit =>
  json({ email, password, name: email.split("@")[0] });

/** The session cookie out of a response, as a browser would keep it. */
const cookieOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

test("health reports the migrations it booted with", async () => {
  const app = await serve();

  const response = await app.api("/api/health");
  const body = (await response.json()) as { ok: boolean; database: { migrations: number; applied: string[] } };

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.database.migrations, 6);
  assert.deepEqual(body.database.applied, [
    "001-users-and-sessions.sql",
    "002-characters.sql",
    "003-favorites.sql",
    "004-notes.sql",
    "005-page-size-16.sql",
    "006-better-auth.sql",
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
    "/api/notes/1",
    { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: "x" }) },
  );

  assert.equal(refused.status, 401);
  assert.deepEqual(await refused.json(), { error: "Sign in first — this is yours alone." });
});

test("a body that is not JSON is the caller's mistake, not ours", async () => {
  const app = await serve();

  const broken = await app.api("/api/notes/1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: "not json",
  });

  assert.equal(broken.status, 400);
  assert.deepEqual(await broken.json(), { error: "That body is not JSON." });
});

test("Better Auth's own endpoints answer under /api/auth, and the cookie is who you are", async () => {
  const app = await serve();

  const registered = await app.api("/api/auth/sign-up/email", signUp("Salma@Example.test"));
  assert.equal(registered.status, 200);
  const created = (await registered.json()) as { user: { id: string; email: string; name: string } };
  assert.equal(created.user.email, "salma@example.test");

  const cookie = cookieOf(registered);
  assert.match(cookie, /^better-auth\.session_token=/);
  assert.match(registered.headers.getSetCookie().join("; "), /HttpOnly/i);

  const me = await app.api("/api/me", { headers: { cookie } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), {
    // Only the address is normalised; the name is whatever sign-up was given.
    user: { id: created.user.id, email: "salma@example.test", name: "Salma" },
  });

  assert.equal((await app.api("/api/me")).status, 401);
  assert.equal((await app.api("/api/favorites")).status, 401);

  const signedOut = await app.api("/api/auth/sign-out", json({}, cookie));
  assert.equal(signedOut.status, 200);
  assert.equal(
    (await app.api("/api/me", { headers: { cookie } })).status,
    401,
    "the session died with the sign-out",
  );
});

test("signing in again over the same address works, and a bad password does not", async () => {
  const app = await serve();
  await app.api("/api/auth/sign-up/email", signUp("salma@example.test"));

  const wrong = await app.api(
    "/api/auth/sign-in/email",
    json({ email: "salma@example.test", password: "expelliarmus43" }),
  );
  assert.ok(wrong.status >= 400, `expected a refusal, got ${wrong.status}`);

  const good = await app.api(
    "/api/auth/sign-in/email",
    json({ email: "salma@example.test", password: "expelliarmus42" }),
  );
  assert.equal(good.status, 200);
  assert.equal((await app.api("/api/me", { headers: { cookie: cookieOf(good) } })).status, 200);
});

test("an address it has never seen works with no configuration", async () => {
  // The Worker builds auth per request, so the address is whatever the request
  // was addressed to: workers.dev, a custom domain, localhost — no var, and no
  // second place to remember. A stranger's origin is still refused, because the
  // trusted origin comes from the request's URL and not from its Origin header.
  const address = "https://hogwarts.example.test";
  const world = await makeWorld([[character()]], { origin: address });
  const app = createApp({ services: world.services, auth: world.auth });

  const signUpFrom = (origin: string) =>
    app.fetch(
      new Request(`${address}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email: "new@example.test", password: "expelliarmus42", name: "new" }),
      }),
    );

  const stranger = await signUpFrom("https://evil.example");
  assert.equal(stranger.status, 403);
  assert.deepEqual(await stranger.json(), { message: "Invalid origin", code: "INVALID_ORIGIN" });

  const ours = await signUpFrom(address);
  assert.equal(ours.status, 200);
  assert.match(ours.headers.getSetCookie().join("; "), /Secure/i, "https earns the Secure cookie");

  const me = await app.fetch(
    new Request(`${address}/api/me`, {
      headers: { cookie: cookieOf(ours) },
    }),
  );
  assert.equal(me.status, 200);
});

test("browsing, favoriting and noting a character over HTTP", async () => {
  const app = await serve();

  const anonymous = await app.api("/api/characters?page=1");
  const cold = (await anonymous.json()) as { data: { id: number; viewer?: unknown }[]; meta: { cached: boolean } };
  assert.equal(cold.meta.cached, false);
  assert.equal(cold.data[0].viewer, undefined);

  const warm = await app.api("/api/characters?page=1");
  assert.equal(((await warm.json()) as { meta: { cached: boolean } }).meta.cached, true);

  const registered = await app.api("/api/auth/sign-up/email", signUp("salma@example.test"));
  const cookie = cookieOf(registered);
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
