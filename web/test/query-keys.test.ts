import assert from "node:assert/strict";
import { test } from "node:test";

import { keys, markFamilies, viewerOf } from "../src/query.ts";

/** The key half of a reader: these tests ask as two accounts and as a stranger. */
const reader = (userId: number) => viewerOf("authenticated", userId).key;

/**
 * The keys are the privacy boundary of the cache: a payload carries whether *this*
 * reader marked a character and what they wrote about it. Two accounts reading
 * the same page must therefore be two entries, and a sign-out must not leave the
 * signed-in reader's entries warm for the next one.
 */
test("two viewers never share an entry that carries a mark", () => {
  assert.notDeepEqual(keys.characters(reader(1), 1), keys.characters(reader(2), 1));
  assert.notDeepEqual(
    keys.character(reader(1), "harry-potter"),
    keys.character(reader(2), "harry-potter"),
  );
  assert.notDeepEqual(keys.favorites(reader(1)), keys.favorites(reader(2)));
  assert.notDeepEqual(keys.note(reader(1), 7), keys.note(reader(2), 7));
});

test("anonymous is a viewer of its own, never a missing half of the key", () => {
  assert.equal(viewerOf("anonymous", null).key, "anonymous");
  assert.equal(viewerOf("checking", undefined).key, "anonymous");
  assert.equal(reader(3), "u3");

  assert.notDeepEqual(keys.characters("anonymous", 1), keys.characters(reader(3), 1));
  assert.notDeepEqual(keys.note("anonymous", 7), keys.note(reader(3), 7));
});

test("one viewer, one page — and a different page is a different entry", () => {
  assert.deepEqual(keys.characters(reader(1), 1), keys.characters(reader(1), 1));
  assert.notDeepEqual(keys.characters(reader(1), 1), keys.characters(reader(1), 2));
  assert.notDeepEqual(keys.character(reader(1), "a"), keys.character(reader(1), "b"));
});

/**
 * The gate is the other half of that boundary: while the session is unanswered a
 * query must not run, because whatever it fetched would be filed under the
 * viewer it guessed rather than the viewer that is.
 */
test("a reader is only asked about once the session has answered", () => {
  assert.equal(viewerOf("checking", null).settled, false);
  assert.equal(viewerOf("anonymous", null).settled, true);
  assert.equal(viewerOf("authenticated", 4).settled, true);
});

test("private data is asked for only when an account can own it", () => {
  assert.equal(viewerOf("checking", null).signedIn, false);
  assert.equal(viewerOf("anonymous", null).signedIn, false);
  assert.equal(viewerOf("authenticated", 4).signedIn, true);
  // An authenticated session without a user in the payload: nobody owns a mark.
  assert.equal(viewerOf("authenticated", null).signedIn, false);
});

test("a press refreshes every entry a mark is shown in, and no other", () => {
  const marked = [
    keys.characters(reader(1), 1),
    keys.character(reader(1), "a"),
    keys.favorites(reader(1)),
  ];

  for (const key of marked) {
    assert.ok(markFamilies.includes(key[0]), `${key[0]} shows a mark and must be refreshed`);
  }

  for (const unmarked of [keys.session(), keys.note(reader(1), 1)]) {
    assert.equal(markFamilies.includes(unmarked[0]), false, `${unmarked[0]} shows no mark`);
  }
});
