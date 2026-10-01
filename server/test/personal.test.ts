import assert from "node:assert/strict";
import { test } from "node:test";

import { NOTE_LIMIT } from "../src/domain/rules.ts";
import { character, makeWorld, rejects, registerUser } from "./harness.ts";

/** A world with one Character in the mirror and one User on it. */
async function worldWithUser() {
  const world = makeWorld([[character()]]);
  const page = await world.services.characters.list(1, null);
  const user = await registerUser(world);
  return { ...world, characterId: page.data[0].id, user };
}

test("a favorite toggles on and off, and leaves nothing behind", async () => {
  const { services, characterId, user } = await worldWithUser();

  assert.deepEqual(services.personal.toggleFavorite(user.id, characterId), { favorited: true });
  assert.deepEqual(
    services.personal.listFavorites(user.id).data.map((entry) => entry.slug),
    ["harry-potter"],
  );

  assert.deepEqual(services.personal.toggleFavorite(user.id, characterId), { favorited: false });
  assert.deepEqual(services.personal.listFavorites(user.id).data, []);
});

test("a favorite on a character that does not exist is refused", async () => {
  const { services, user } = await worldWithUser();

  assert.throws(() => services.personal.toggleFavorite(user.id, 999), rejects("not-found", "No such character."));
  assert.throws(() => services.personal.toggleFavorite(user.id, null), rejects("not-found", "No such character."));
});

test("one user's favorites are not another user's", async () => {
  const world = await worldWithUser();
  const { services, characterId, user } = world;
  const stranger = await registerUser(world, "draco@example.test");

  assert.ok(user.id !== stranger.id);
  services.personal.toggleFavorite(user.id, characterId);

  assert.equal(services.personal.listFavorites(stranger.id).data.length, 0, "a Favorite is never shared");
  assert.equal(services.personal.readNote(stranger.id, characterId).note, null);
});

test("a note is trimmed, saved in place, and never appended to", async () => {
  const { services, characterId, user } = await worldWithUser();

  assert.equal(services.personal.readNote(user.id, characterId).note, null);

  const first = services.personal.saveNote(user.id, characterId, "  the chosen one  ");
  assert.equal(first.note.body, "the chosen one");

  const second = services.personal.saveNote(user.id, characterId, "Defeated Voldemort");
  assert.equal(second.note.body, "Defeated Voldemort");
  assert.equal(services.personal.readNote(user.id, characterId).note?.body, "Defeated Voldemort");
});

test("a note has to say something, and not too much", async () => {
  const { services, characterId, user } = await worldWithUser();

  assert.throws(() => services.personal.saveNote(user.id, characterId, "   "), rejects("invalid", "An empty note is not worth keeping. Write something first."));

  const tooLong = "x".repeat(NOTE_LIMIT + 1);
  assert.throws(() => services.personal.saveNote(user.id, characterId, tooLong), rejects("invalid", `Notes stop at ${NOTE_LIMIT} characters. Yours is ${NOTE_LIMIT + 1}.`));

  assert.equal(services.personal.saveNote(user.id, characterId, "x".repeat(NOTE_LIMIT)).note.body.length, NOTE_LIMIT);
  assert.throws(() => services.personal.saveNote(user.id, 999, "anywhere"), rejects("not-found", "No such character."));
});
