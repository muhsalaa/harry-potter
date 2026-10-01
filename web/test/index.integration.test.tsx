import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { apiCalls, character, noSession, page, renderApp, stubApi } from "./harness";

describe("the index", () => {
  it("draws the corpus number and a tile per character", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters?page=1": page(
        [
          character({ id: 1, slug: "harry-potter", name: "Harry Potter" }),
          character({ id: 2, slug: "hermione-granger", name: "Hermione Granger" }),
        ],
        { records: 5410, pages: 339 },
      ),
    });

    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Wizarding Index" })).toBeDefined();

    // The masthead draws immediately; the number arrives with the corpus.
    expect(await screen.findByText("5,410")).toBeDefined();
    expect(screen.getByText("339 pages")).toBeDefined();

    // A tile is a link to the record, named after the character.
    expect(screen.getByTitle("Hermione Granger").getAttribute("href")).toBe(
      "/characters/hermione-granger",
    );
    expect(apiCalls).toContain("/api/characters?page=1");
  });

  it("takes the page from the address", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters?page=3": page([character({ name: "Luna Lovegood" })], {
        page: 3,
        records: 40,
        pages: 3,
      }),
    });

    renderApp("/?page=3");

    expect(await screen.findByText("Luna Lovegood")).toBeDefined();
    expect(apiCalls).toContain("/api/characters?page=3");
  });

  it("ignores a page in the address that is not a number", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters?page=1": page([character({ name: "Ron Weasley" })]),
    });

    renderApp("/?page=banana");

    expect(await screen.findByText("Ron Weasley")).toBeDefined();
    expect(apiCalls).toContain("/api/characters?page=1");
    expect(apiCalls).not.toContain("/api/characters?page=NaN");
  });

  it("says so when the index cannot be read", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters?page=1": { status: 500, body: { error: "The mirror is not answering." } },
    });

    renderApp("/");

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/The index is not answering/)).toBeDefined();
  });
});
