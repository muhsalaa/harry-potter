import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { apiCalls, character, noSession, renderApp, stubApi } from "./harness";

describe("one record", () => {
  it("shows the fields it has and skips the ones it does not", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters/harry-potter": {
        data: character({
          name: "Harry Potter",
          house: "Gryffindor",
          bloodStatus: "half-blood",
          species: "human",
          patronus: "Stag",
          boggart: null,
          eyeColor: null,
        }),
      },
    });

    renderApp("/characters/harry-potter");

    expect(await screen.findByRole("heading", { level: 1, name: "Harry Potter" })).toBeDefined();

    // The line under the name is the fields it has, joined.
    expect(screen.getByText("Gryffindor · half-blood · human")).toBeDefined();

    expect(screen.getByText("Patronus")).toBeDefined();
    expect(screen.getByText("Stag")).toBeDefined();

    // An empty field is not a fact, and a row saying so would be a lie.
    expect(screen.queryByText("Boggart")).toBeNull();
    expect(screen.queryByText("Eye colour")).toBeNull();
  });

  it("offers a reader with no session a way in, and asks for nothing private", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters/harry-potter": { data: character() },
    });

    renderApp("/characters/harry-potter");

    await screen.findByRole("heading", { level: 1, name: "Harry Potter" });

    // Both mark doors carry the guard and come back to this record. (The bar has
    // a plain sign-in of its own, which is why this asks for the guarded ones.)
    const doors = screen
      .getAllByRole("link", { name: "Sign in" })
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/login?next="));

    expect(doors).toEqual([
      "/login?next=%2Fcharacters%2Fharry-potter",
      "/login?next=%2Fcharacters%2Fharry-potter",
    ]);

    expect(screen.getByText(/to keep this character in your list/)).toBeDefined();
    expect(screen.getByText(/to keep a private note on this character/)).toBeDefined();

    // The gate: nothing on this page belongs to an account, so nothing is asked
    // for on behalf of one. A mark, or a note, would be somebody else's.
    expect(apiCalls).not.toContain("/api/notes/1");
    expect(apiCalls.filter((call) => call.startsWith("/api/favorites"))).toHaveLength(0);
  });

  it("says so when the name is not in the index", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/characters/nobody": { status: 404, body: { error: "No such character." } },
    });

    renderApp("/characters/nobody");

    expect(await screen.findByRole("heading", { name: "No entry for that name" })).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
