import assert from "node:assert/strict";
import { test } from "node:test";

import { signInHref, signUpHref } from "../src/auth/next.ts";

/**
 * A `next` arrives from the address bar, so it is input from outside the app: a
 * destination that would leave it is not honoured. The guard sits inside the href
 * builders, so these tests read the url a link would actually point at.
 */
test("a same-site destination is carried through both doors", () => {
  assert.equal(signInHref("/characters/harry-potter"), "/login?next=%2Fcharacters%2Fharry-potter");
  assert.equal(signUpHref("/favorites"), "/register?next=%2Ffavorites");
});

test("a destination that leaves the site falls back to the list", () => {
  const offSite = ["//evil.example", "https://evil.example", "javascript:alert(1)", "favorites", ""];

  for (const destination of offSite) {
    assert.equal(signInHref(destination), "/login?next=%2Ffavorites");
    assert.equal(signUpHref(destination), "/register?next=%2Ffavorites");
  }
});

test("no destination at all lands on the list", () => {
  assert.equal(signInHref(null), "/login?next=%2Ffavorites");
  assert.equal(signUpHref(null), "/register?next=%2Ffavorites");
});
