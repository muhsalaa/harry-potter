import assert from "node:assert/strict";
import { test } from "node:test";

import Database from "better-sqlite3";

import { createSession, deleteExpiredSessions, destroySession, findSessionUser } from "../src/auth.js";
import { MIGRATIONS_DIR } from "../src/db.js";
import { hashSessionToken, hashPassword, verifyPassword } from "../src/session.js";
import { migrate } from "../src/migrate.js";

function database() {
  const db = new Database(":memory:");
  migrate(db, MIGRATIONS_DIR);
  db.prepare("INSERT INTO users (email, password_hash) VALUES ('salma@example.test', 'x')").run();
  return db;
}

test("a password verifies against its own hash and nothing else", async () => {
  const stored = await hashPassword("expelliarmus42");

  assert.ok(!stored.includes("expelliarmus42"), "the plaintext is not in the stored value");
  assert.equal(await verifyPassword("expelliarmus42", stored), true);
  assert.equal(await verifyPassword("expelliarmus43", stored), false);
  assert.equal(await verifyPassword("expelliarmus42", "not-a-hash"), false);

  assert.notEqual(await hashPassword("expelliarmus42"), stored, "the salt makes hashes differ");
});

test("the database stores a hash of the session token, never the token", () => {
  const db = database();
  const token = createSession(db, 1);
  const { token_hash } = db.prepare("SELECT token_hash FROM sessions").get();

  assert.notEqual(token_hash, token);
  assert.equal(token_hash, hashSessionToken(token));
  assert.deepEqual(findSessionUser(db, token), { id: 1, email: "salma@example.test" });
});

test("logging out revokes: the same cookie stops resolving", () => {
  const db = database();
  const token = createSession(db, 1);

  destroySession(db, token);

  assert.equal(findSessionUser(db, token), null);
  assert.equal(db.prepare("SELECT count(*) AS c FROM sessions").get().c, 0);
});

test("an expired session does not resolve and gets swept", () => {
  const db = database();
  const token = createSession(db, 1);
  db.prepare("UPDATE sessions SET expires_at = datetime('now', '-1 day')").run();

  assert.equal(findSessionUser(db, token), null);
  assert.equal(deleteExpiredSessions(db), 1);
});
