import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { apiCalls, character, noSession, renderApp, stubApi } from "./harness";

const reader = { user: { id: "7f0d3a9e-6b1c-4a4e-9d3f-1c2b3a4d5e6f", email: "reader@example.com", name: "reader" } };

describe("the list", () => {
  it("tells a reader with no session what it is for, and asks for no list", async () => {
    stubApi({ "/api/me": noSession });

    renderApp("/favorites");

    expect(await screen.findByText(/A list belongs to an account/)).toBeDefined();

    // The bar carries a plain sign-in of its own; the list's doors carry the way back.
    const doors = screen
      .getAllByRole("link", { name: /Sign in|Create an account/ })
      .map((link) => link.getAttribute("href"));

    expect(doors).toContain("/login?next=%2Ffavorites");
    expect(doors).toContain("/register?next=%2Ffavorites");

    // The gate, asserted the hard way: the session was read, and nothing else
    // was. A request for /api/favorites under the anonymous key would spend a
    // round trip on a list that cannot exist, and would file the answer under a
    // key that is not its own.
    expect(apiCalls).toEqual(["/api/me"]);
  });

  it("lists what the account has marked", async () => {
    stubApi({
      "/api/me": reader,
      "/api/favorites": {
        data: [
          character({ id: 12, slug: "hedwig", name: "Hedwig" }),
          character({ id: 13, slug: "crookshanks", name: "Crookshanks" }),
        ],
      },
    });

    renderApp("/favorites");

    expect(await screen.findByRole("heading", { level: 1, name: "Your list" })).toBeDefined();
    expect(await screen.findByText("Hedwig")).toBeDefined();
    expect(screen.getByText("Crookshanks")).toBeDefined();
    expect(screen.getByText("2 marked · private to you")).toBeDefined();
  });

  it("has an answer for an account that has marked nothing", async () => {
    stubApi({ "/api/me": reader, "/api/favorites": { data: [] } });

    renderApp("/favorites");

    expect(await screen.findByText(/Nothing marked yet/)).toBeDefined();
    expect(screen.getByText("0 marked · private to you")).toBeDefined();
  });
});
