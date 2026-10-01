import assert from "node:assert/strict";
import { test } from "node:test";

import { sweepExpiredSessions } from "../src/auth.ts";
import { makeWorld, registerUser } from "./harness.ts";

/** D1 hands rows back as `unknown`; a query in a test knows better. */
const rows = async <T>(d1: D1Database, sql: string): Promise<T[]> =>
  (await d1.prepare(sql).all()).results as T[];

const PASSWORD = "expelliarmus42";

test("signing up writes the account Better Auth expects, and no plaintext", async () => {
  const world = await makeWorld();

  const { response } = await world.auth.api.signUpEmail({
    body: { email: "Salma@Example.test", password: PASSWORD, name: "Salma" },
    returnHeaders: true,
  });

  assert.match(response.user.id, /^[0-9a-f-]{36}$/, "the id is a uuid, not a row number");
  assert.equal(response.user.email, "salma@example.test", "the address is normalised");

  const accounts = await rows<{ providerId: string; password: string }>(
    world.d1,
    "SELECT providerId, password FROM account",
  );
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].providerId, "credential");
  assert.ok(!accounts[0].password.includes(PASSWORD), "the plaintext is not in the stored value");
  assert.match(
    accounts[0].password,
    /^[0-9a-f]{32}:[0-9a-f]{128}$/,
    "salt:key in hex, which is how Better Auth writes scrypt",
  );
});

test("the session cookie is the only thing that names a session, and it is guarded", async () => {
  const world = await makeWorld();

  const { headers, response } = await world.auth.api.signUpEmail({
    body: { email: "salma@example.test", password: PASSWORD, name: "Salma" },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().join("; ");

  assert.match(cookie, /better-auth\.session_token=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.ok(!/Secure/i.test(cookie), "the test's base URL is http, so the browser would refuse a Secure cookie");

  const stored = await rows<{ token: string; userId: string }>(world.d1, "SELECT token, userId FROM session");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].userId, response.user.id);

  // The cookie is the row's token plus an HMAC of it: the signature is what
  // makes a guessed token useless, and the row is what makes a stolen one real.
  const value = cookie.split("=").slice(1).join("=");
  assert.ok(value.startsWith(stored[0].token));
  assert.equal(value.split(".").length, 2, "token and signature");
});

test("an https address earns a Secure cookie, an http one does not", async () => {
  const world = await makeWorld([], { origin: "https://portal.example.test" });

  const { headers } = await world.auth.api.signUpEmail({
    body: { email: "salma@example.test", password: PASSWORD, name: "Salma" },
    returnHeaders: true,
  });

  assert.match(headers.getSetCookie().join("; "), /Secure/i);
});

test("a session is readable, and signing out ends it", async () => {
  const world = await makeWorld();
  const user = await registerUser(world);

  const { headers } = await world.auth.api.signInEmail({
    body: { email: user.email, password: PASSWORD },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");

  const found = await world.auth.api.getSession({ headers: new Headers({ cookie }) });
  assert.equal(found?.user.id, user.id);

  const token = cookie.split("=")[1]?.split(".")[0] ?? "";

  await world.auth.api.signOut({ headers: new Headers({ cookie }) });

  assert.equal(await world.auth.api.getSession({ headers: new Headers({ cookie }) }), null);

  const left = await rows<{ token: string }>(world.d1, "SELECT token FROM session");
  assert.ok(!left.some((row) => row.token === token), "the row for that cookie went with it");
});

test("a second account on the same address is refused, and a wrong password is not one", async () => {
  const world = await makeWorld();
  await registerUser(world, "salma@example.test");

  await assert.rejects(() =>
    world.auth.api.signUpEmail({
      body: { email: "salma@example.test", password: PASSWORD, name: "Someone" },
    }),
  );

  await assert.rejects(() =>
    world.auth.api.signInEmail({ body: { email: "salma@example.test", password: "expelliarmus43" } }),
  );

  await assert.rejects(() =>
    world.auth.api.signInEmail({ body: { email: "nobody@example.test", password: PASSWORD } }),
  );

  assert.equal((await rows(world.d1, "SELECT id FROM user")).length, 1, "nothing was written behind them");
});

test("a password shorter than the floor is refused before anything is written", async () => {
  const world = await makeWorld();

  await assert.rejects(() =>
    world.auth.api.signUpEmail({ body: { email: "salma@example.test", password: "short", name: "Salma" } }),
  );

  assert.equal((await rows(world.d1, "SELECT id FROM user")).length, 0);
});

test("an expired session does not resolve, and the sweep takes its row away", async () => {
  const world = await makeWorld();
  const user = await registerUser(world);

  const { headers } = await world.auth.api.signInEmail({
    body: { email: user.email, password: PASSWORD },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");

  await world.d1.prepare("UPDATE session SET expiresAt = ?").bind(Date.now() - 1000).run();

  assert.equal(await world.auth.api.getSession({ headers: new Headers({ cookie }) }), null);

  await sweepExpiredSessions(world.env);

  assert.equal((await rows(world.d1, "SELECT id FROM session")).length, 0);
});
