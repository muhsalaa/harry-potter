import assert from "node:assert/strict";
import { test } from "node:test";

import { scryptPasswords } from "../src/infrastructure/crypto/passwords.ts";
import { makeWorld, rejects } from "./harness.ts";

const PASSWORD = "expelliarmus42";

/** D1 hands rows back as `unknown`; a query in a test knows better. */
const rows = async <T>(d1: D1Database, sql: string): Promise<T[]> =>
  (await d1.prepare(sql).all()).results as T[];

test("registering signs you in, under a normalised address", async () => {
  const { services } = await makeWorld();

  const { user, token } = await services.accounts.register("  Salma@Example.TEST ", PASSWORD);

  assert.equal(user.email, "salma@example.test");
  assert.deepEqual(await services.accounts.resolve(token), {
    id: user.id,
    email: "salma@example.test",
  });
});

test("the session cookie is a token the database never stores", async () => {
  const { services, d1 } = await makeWorld();
  const { token } = await services.accounts.register("salma@example.test", PASSWORD);

  const stored = await rows<{ token_hash: string }>(d1, "SELECT token_hash FROM sessions");

  assert.equal(stored.length, 1);
  assert.notEqual(stored[0].token_hash, token);
  assert.match(stored[0].token_hash, /^[0-9a-f]{64}$/);
});

test("bad credentials are refused, and nothing is written behind them", async () => {
  const { services, d1 } = await makeWorld();

  await assert.rejects(
    () => services.accounts.register("not-an-address", PASSWORD),
    rejects("invalid", "That email address is not one an address could have."),
  );
  await assert.rejects(
    () => services.accounts.register("salma@example.test", "short"),
    rejects("invalid", "Passwords here are at least 8 characters."),
  );

  const { user } = await services.accounts.register("salma@example.test", PASSWORD);
  await assert.rejects(
    () => services.accounts.register("SALMA@example.test", PASSWORD),
    rejects("conflict", "That email already has an account. Sign in instead."),
  );

  await assert.rejects(
    () => services.accounts.login("salma@example.test", "expelliarmus43"),
    rejects("unauthorized", "That email and password do not match an account."),
  );
  await assert.rejects(
    () => services.accounts.login("nobody@example.test", PASSWORD),
    rejects("unauthorized", "That email and password do not match an account."),
  );

  const counted = await rows<{ c: number }>(d1, "SELECT count(*) AS c FROM users");
  assert.equal(Number(counted[0].c), 1);

  const { token } = await services.accounts.login("salma@example.test", PASSWORD);
  assert.deepEqual(await services.accounts.resolve(token), user);
});

test("logging out revokes: the same cookie stops resolving", async () => {
  const { services, d1 } = await makeWorld();
  const { token } = await services.accounts.register("salma@example.test", PASSWORD);

  await services.accounts.logout(token);
  await services.accounts.logout(token);

  assert.equal(await services.accounts.resolve(token), null);

  const counted = await rows<{ c: number }>(d1, "SELECT count(*) AS c FROM sessions");
  assert.equal(Number(counted[0].c), 0);
});

test("an expired session does not resolve and gets swept", async () => {
  const { services, d1, stores } = await makeWorld();
  const { token } = await services.accounts.register("salma@example.test", PASSWORD);

  await d1.prepare("UPDATE sessions SET expires_at = datetime('now', '-1 day')").run();

  assert.equal(await services.accounts.resolve(token), null);
  assert.equal(await services.accounts.resolve(null), null);
  assert.equal(await stores.accounts.sweepSessions(), 1);
});

test("a password verifies against its own hash and nothing else", async () => {
  const stored = await scryptPasswords.hash(PASSWORD);

  assert.ok(!stored.includes(PASSWORD), "the plaintext is not in the stored value");
  assert.equal(await scryptPasswords.verify(PASSWORD, stored), true);
  assert.equal(await scryptPasswords.verify("expelliarmus43", stored), false);
  assert.equal(await scryptPasswords.verify(PASSWORD, "not-a-hash"), false);
  assert.equal(await scryptPasswords.verify(PASSWORD, ""), false);
  assert.notEqual(await scryptPasswords.hash(PASSWORD), stored, "the salt makes hashes differ");
});
