import { describe, expect, it } from "vitest";

import { signInHref, signUpHref } from "./next";

/**
 * A `next` arrives from the address bar, so it is input from outside the app: a
 * destination that would leave it is not honoured. The guard sits inside the href
 * builders, so these tests read the url a link would actually point at.
 */
describe("the way back from an account door", () => {
  it("carries a same-site destination through both doors", () => {
    expect(signInHref("/characters/harry-potter")).toBe("/login?next=%2Fcharacters%2Fharry-potter");
    expect(signUpHref("/favorites")).toBe("/register?next=%2Ffavorites");
  });

  it("falls back to the list when the destination leaves the site", () => {
    const offSite = [
      "//evil.example",
      "https://evil.example",
      "javascript:alert(1)",
      "favorites",
      "",
    ];

    for (const destination of offSite) {
      expect(signInHref(destination)).toBe("/login?next=%2Ffavorites");
      expect(signUpHref(destination)).toBe("/register?next=%2Ffavorites");
    }
  });

  it("lands on the list when the reader gave no destination", () => {
    expect(signInHref(null)).toBe("/login?next=%2Ffavorites");
    expect(signUpHref(null)).toBe("/register?next=%2Ffavorites");
  });
});
