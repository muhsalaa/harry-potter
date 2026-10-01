import { describe, expect, it } from "vitest";

import { keys, markFamilies, viewerOf } from "./query";

/** The key half of a reader: these tests ask as two accounts and as a stranger. */
const reader = (userId: number) => viewerOf("authenticated", userId).key;

/**
 * The keys are the privacy boundary of the cache: a payload carries whether
 * *this* reader marked a character and what they wrote about it. Two accounts
 * reading the same page must therefore be two entries, and a sign-out must not
 * leave the signed-in reader's entries warm for the next one.
 */
describe("the cache keys", () => {
  it("never share an entry that carries a mark between two viewers", () => {
    expect(keys.characters(reader(1), 1)).not.toEqual(keys.characters(reader(2), 1));
    expect(keys.character(reader(1), "harry-potter")).not.toEqual(
      keys.character(reader(2), "harry-potter"),
    );
    expect(keys.favorites(reader(1))).not.toEqual(keys.favorites(reader(2)));
    expect(keys.note(reader(1), 7)).not.toEqual(keys.note(reader(2), 7));
  });

  it("gives anonymous a viewer of its own, never a missing half of the key", () => {
    expect(viewerOf("anonymous", null).key).toBe("anonymous");
    expect(viewerOf("checking", undefined).key).toBe("anonymous");
    expect(reader(3)).toBe("u3");

    expect(keys.characters("anonymous", 1)).not.toEqual(keys.characters(reader(3), 1));
    expect(keys.note("anonymous", 7)).not.toEqual(keys.note(reader(3), 7));
  });

  it("treats a different page, and a different record, as a different entry", () => {
    expect(keys.characters(reader(1), 1)).toEqual(keys.characters(reader(1), 1));
    expect(keys.characters(reader(1), 1)).not.toEqual(keys.characters(reader(1), 2));
    expect(keys.character(reader(1), "a")).not.toEqual(keys.character(reader(1), "b"));
  });
});

/**
 * The gate is the other half of that boundary: while the session is unanswered a
 * query must not run, because whatever it fetched would be filed under the
 * viewer it guessed rather than the viewer that is.
 */
describe("the viewer gate", () => {
  it("asks about a reader only once the session has answered", () => {
    expect(viewerOf("checking", null).settled).toBe(false);
    expect(viewerOf("anonymous", null).settled).toBe(true);
    expect(viewerOf("authenticated", 4).settled).toBe(true);
  });

  it("asks for private data only when an account can own it", () => {
    expect(viewerOf("checking", null).signedIn).toBe(false);
    expect(viewerOf("anonymous", null).signedIn).toBe(false);
    expect(viewerOf("authenticated", 4).signedIn).toBe(true);
    // An authenticated session without a user in the payload: nobody owns a mark.
    expect(viewerOf("authenticated", null).signedIn).toBe(false);
  });
});

describe("invalidating a mark", () => {
  it("refreshes every entry a mark is shown in, and no other", () => {
    const marked = [
      keys.characters(reader(1), 1),
      keys.character(reader(1), "a"),
      keys.favorites(reader(1)),
    ];

    for (const key of marked) {
      expect(markFamilies, `${key[0]} shows a mark and must be refreshed`).toContain(key[0]);
    }

    expect(markFamilies).not.toContain(keys.session()[0]);
    expect(markFamilies).not.toContain(keys.note(reader(1), 1)[0]);
  });
});
