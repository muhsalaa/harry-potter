import assert from "node:assert/strict";
import { test } from "node:test";

import { keys, viewerKey } from "../src/query.ts";

/**
 * The keys are the privacy boundary of the cache: a payload carries whether *this*
 * reader marked a character and what they wrote about it. Two accounts reading
 * the same page must therefore be two entries, and a sign-out must not leave the
 * signed-in reader's entries warm for the next one.
 */
test("two viewers never share an entry that carries a mark", () => {
  assert.notDeepEqual(keys.characters("u1", 1), keys.characters("u2", 1));
  assert.notDeepEqual(keys.character("u1", "harry-potter"), keys.character("u2", "harry-potter"));
  assert.notDeepEqual(keys.favorites("u1"), keys.favorites("u2"));
  assert.notDeepEqual(keys.note("u1", 7), keys.note("u2", 7));
});

test("anonymous is a viewer of its own, never a missing half of the key", () => {
  assert.equal(viewerKey(null), "anonymous");
  assert.equal(viewerKey(undefined), "anonymous");
  assert.equal(viewerKey(3), "u3");

  assert.notDeepEqual(keys.characters("anonymous", 1), keys.characters("u3", 1));
  assert.notDeepEqual(keys.note("anonymous", 7), keys.note("u3", 7));
});

test("one viewer, one page — and a different page is a different entry", () => {
  assert.deepEqual(keys.characters("u1", 1), keys.characters("u1", 1));
  assert.notDeepEqual(keys.characters("u1", 1), keys.characters("u1", 2));
  assert.notDeepEqual(keys.character("u1", "a"), keys.character("u1", "b"));
});
