import { describe, expect, it } from "vitest";

// Vite hands the stylesheet over as text, so the test reads exactly what the
// build reads — and the app's tsconfig stays free of node types.
import tokens from "../styles/tokens.css?raw";
import { PORTRAIT_H, PORTRAIT_W, portraitArt } from "./portraits";

const names = Array.from({ length: 300 }, (_, index) => `character ${index}`);

describe("the drawn plates", () => {
  it("stay inside the grid and name a token that exists", () => {
    for (const name of names) {
      for (const rect of portraitArt(name)) {
        expect(tokens, `tokens.css has no --hp-art-${rect.fill} (drawn for ${name})`).toContain(
          `--hp-art-${rect.fill}:`,
        );

        const inside =
          rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x + rect.w <= PORTRAIT_W &&
          rect.y + rect.h <= PORTRAIT_H;

        expect(inside, `a rectangle leaves the ${PORTRAIT_W} × ${PORTRAIT_H} grid`).toBe(true);
      }
    }
  });

  it("draws the same plate for the same name, and keeps all four in rotation", () => {
    const harry = portraitArt("Harry Potter");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(portraitArt("Harry Potter")).toEqual(harry);
    }

    expect(new Set(names.map((name) => portraitArt(name))).size).toBe(4);
  });
});
