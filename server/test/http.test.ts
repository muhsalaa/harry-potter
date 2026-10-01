import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

import { createApp } from "../src/http/app.ts";
import { character, makeWorld } from "./harness.ts";

/** A real server on a throwaway port: routing, cookies and status codes are the surface here. */
async function serve() {
  const world = makeWorld([[character()]]);
  const server = createApp(world.services).listen(0);
  await once(server, "listening");

  const { port } = server.address() as AddressInfo;

  return {
    ...world,
    url: (path: string) => `http://127.0.0.1:${port}${path}`,
    close: () => new Promise<void>((closed) => server.close(() => closed())),
  };
}

const json = (body: unknown, cookie?: string): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});

test("health reports the migrations it booted with", async () => {
  const app = await serve();
  try {
    const response = await fetch(app.url("/api/health"));
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

    const missing = await fetch(app.url("/api/nonesuch"));
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "No such endpoint." });
  } finally {
    await app.close();
  }
});

test("a rejected promise from an async route is answered, not swallowed", async () => {
  const app = await serve();
  try {
    const refused = await fetch(app.url("/api/auth/register"), json({ email: "not-an-address", password: "expelliarmus42" }));

    assert.equal(refused.status, 400);
    assert.deepEqual(await refused.json(), { error: "That email address is not one an address could have." });
  } finally {
    await app.close();
  }
});

test("register hands out a cookie, and the cookie is who you are", async () => {
  const app = await serve();
  try {
    const registered = await fetch(app.url("/api/auth/register"), json({ email: "Salma@Example.test", password: "expelliarmus42" }));
    assert.equal(registered.status, 201);
    assert.deepEqual(await registered.json(), { user: { id: 1, email: "salma@example.test" } });

    const cookie = registered.headers.getSetCookie()[0].split(";")[0];
    assert.match(cookie, /^portal_session=[0-9a-f]{64}$/);

    const me = await fetch(app.url("/api/me"), { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { user: { id: 1, email: "salma@example.test" } });

    assert.equal((await fetch(app.url("/api/me"))).status, 401);
    assert.equal((await fetch(app.url("/api/favorites"))).status, 401);

    const signedOut = await fetch(app.url("/api/auth/logout"), json({}, cookie));
    assert.equal(signedOut.status, 204);
    assert.equal((await fetch(app.url("/api/me"), { headers: { cookie } })).status, 401, "the cookie died with the session");
  } finally {
    await app.close();
  }
});

test("browsing, favoriting and noting a character over HTTP", async () => {
  const app = await serve();
  try {
    const anonymous = await fetch(app.url("/api/characters?page=1"));
    const cold = (await anonymous.json()) as { data: { id: number; viewer?: unknown }[]; meta: { cached: boolean } };
    assert.equal(cold.meta.cached, false);
    assert.equal(cold.data[0].viewer, undefined);

    const warm = await fetch(app.url("/api/characters?page=1"));
    assert.equal(((await warm.json()) as { meta: { cached: boolean } }).meta.cached, true);

    const registered = await fetch(app.url("/api/auth/register"), json({ email: "salma@example.test", password: "expelliarmus42" }));
    const cookie = registered.headers.getSetCookie()[0].split(";")[0];
    const id = cold.data[0].id;

    const favorited = await fetch(app.url(`/api/favorites/${id}`), json({}, cookie));
    assert.deepEqual(await favorited.json(), { favorited: true });

    const listed = (await (await fetch(app.url("/api/favorites"), { headers: { cookie } })).json()) as {
      data: { slug: string; viewer?: { favorited: boolean; hasNote: boolean } }[];
    };
    assert.equal(listed.data.length, 1);
    assert.equal(listed.data[0].slug, "harry-potter");
    assert.deepEqual(listed.data[0].viewer, { favorited: true, hasNote: false });

    const saved = await fetch(app.url(`/api/notes/${id}`), {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ body: "  the chosen one  " }),
    });
    assert.equal(saved.status, 200);
    assert.equal(((await saved.json()) as { note: { body: string } }).note.body, "the chosen one");

    const empty = await fetch(app.url(`/api/notes/${id}`), {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ body: "   " }),
    });
    assert.equal(empty.status, 400);
    assert.deepEqual(await empty.json(), { error: "An empty note is not worth keeping. Write something first." });

    const noSuchCharacter = await fetch(app.url("/api/favorites/9999"), json({}, cookie));
    assert.equal(noSuchCharacter.status, 404);
  } finally {
    await app.close();
  }
});
