import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { PORTRAIT_H, PORTRAIT_W, portraitArt } from "../src/components/portraits.ts";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(here, "..", "src", "styles", "tokens.css"), "utf8");

const names = Array.from({ length: 300 }, (_, index) => `character ${index}`);

test("every plate draws inside its grid and names a token that exists", () => {
  for (const name of names) {
    for (const rect of portraitArt(name)) {
      assert.ok(
        tokens.includes(`--hp-art-${rect.fill}:`),
        `tokens.css has no --hp-art-${rect.fill} (drawn for ${name})`,
      );
      assert.ok(
        rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x + rect.w <= PORTRAIT_W &&
          rect.y + rect.h <= PORTRAIT_H,
        `a rectangle leaves the ${PORTRAIT_W} × ${PORTRAIT_H} grid: ${JSON.stringify(rect)}`,
      );
    }
  }
});

test("a name always draws the same plate, and all four are in rotation", () => {
  const harry = portraitArt("Harry Potter");
  for (let i = 0; i < 5; i += 1) {
    assert.equal(portraitArt("Harry Potter"), harry, "the same name must not change its art");
  }

  const plates = new Set(names.map((name) => portraitArt(name)));
  assert.equal(plates.size, 4, "four plates, and every one of them reachable");
});
