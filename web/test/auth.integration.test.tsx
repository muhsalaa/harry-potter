import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { apiCalls, character, noSession, renderApp, stubApi } from "./harness";

const reader = { user: { id: 7, email: "reader@example.com" } };

/** Fill the form and press the button, the way a reader does. */
function signIn() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "reader@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("signing in", () => {
  it("refuses a destination that leaves the app and lands the reader on the list", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/auth/login": reader,
      "/api/favorites": { data: [character({ slug: "hedwig", name: "Hedwig" })] },
    });

    renderApp("/login?next=//evil.example");

    // Both ways out of this page keep the guarded destination.
    expect(screen.getByRole("link", { name: "Create an account" }).getAttribute("href")).toBe(
      "/register?next=%2Ffavorites",
    );

    signIn();

    expect(await screen.findByRole("heading", { level: 1, name: "Your list" })).toBeDefined();
    expect(await screen.findByText("Hedwig")).toBeDefined();
    expect(apiCalls).toContain("/api/auth/login");
    expect(apiCalls).toContain("/api/favorites");
  });

  it("comes back to a destination inside the app", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/auth/login": reader,
      "/api/characters/hedwig": { data: character({ slug: "hedwig", name: "Hedwig" }) },
    });

    renderApp("/login?next=/characters/hedwig");

    signIn();

    expect(await screen.findByRole("heading", { level: 1, name: "Hedwig" })).toBeDefined();
    expect(apiCalls).toContain("/api/characters/hedwig");
  });

  it("shows what the server said when the password is wrong", async () => {
    stubApi({
      "/api/me": noSession,
      "/api/auth/login": { status: 401, body: { error: "That email and password do not match." } },
    });

    renderApp("/login");

    signIn();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText("That email and password do not match.")).toBeDefined();
    // Still on the form, with the way out intact.
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });
});

describe("creating an account", () => {
  it("asks for eight characters before it will send anything", async () => {
    stubApi({ "/api/me": noSession, "/api/auth/register": reader });

    renderApp("/register");

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });

    expect(screen.getByText(/shorter than 8 characters/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Create account" })).toHaveProperty("disabled", true);
    expect(apiCalls).not.toContain("/api/auth/register");
  });
});
