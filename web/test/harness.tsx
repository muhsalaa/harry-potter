import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach } from "vitest";

import type { Character, CharacterList } from "../src/api/characters";
import { AuthProvider } from "../src/auth/auth-context";
import { AppRoutes } from "../src/routes";

/**
 * A browser-shaped harness: the real routes, the real providers, and a fetch
 * that answers only what the test asked for.
 *
 * Nothing here reaches the network. A path a test did not plan for throws, so a
 * page that quietly starts asking a new question fails instead of passing on a
 * blank answer — and `apiCalls` records every question, so a test can assert
 * what a page did *not* ask for. That is the whole point of the viewer gate:
 * an anonymous reader's page must not request anybody's marks.
 */

/** Every request the app made, in order. */
export const apiCalls: string[] = [];

/** How the API answers a reader with no session. */
export const noSession = { status: 401, body: { error: "Not signed in." } };

type Reply = unknown;

/**
 * A reply is the body itself, or an envelope (`{ status, body }`) when a test
 * wants a status other than 200. The envelope is told apart by its `status` key,
 * which no payload the api sends carries at the top level.
 */
const isEnvelope = (reply: unknown): reply is { status: number; body?: unknown } =>
  typeof reply === "object" && reply !== null && "status" in reply;

let replies: Record<string, Reply> = {};

/** Answer these paths, exactly; anything else is a failure the test should hear about. */
export function stubApi(next: Record<string, Reply>) {
  replies = next;
}

beforeEach(() => {
  apiCalls.length = 0;
  replies = {};
  // jsdom has no layout, and the index returns to the top when the page changes.
  window.scrollTo = () => {};
});

afterEach(cleanup);

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const path = String(input);
  apiCalls.push(path);

  const reply = replies[path];
  if (reply === undefined) throw new Error(`no reply planned for ${path}`);

  const status = isEnvelope(reply) ? reply.status : 200;
  const body = isEnvelope(reply) ? reply.body : reply;

  // Only the parts of Response the api client reads: ok, status, json.
  return {
    ok: status < 400,
    status,
    json: async () => body,
  } as Response;
}) as typeof fetch;

/** One character, with every field a test does not care about filled in. */
export function character(overrides: Partial<Character> = {}): Character {
  return {
    id: 1,
    slug: "harry-potter",
    name: "Harry Potter",
    image: null,
    house: "Gryffindor",
    bloodStatus: null,
    species: "human",
    gender: "male",
    born: null,
    died: null,
    eyeColor: null,
    hairColor: null,
    skinColor: null,
    height: null,
    weight: null,
    nationality: null,
    maritalStatus: null,
    patronus: null,
    boggart: null,
    animagus: null,
    aliasNames: [],
    familyMembers: [],
    jobs: [],
    romances: [],
    titles: [],
    wands: [],
    wiki: null,
    ...overrides,
  };
}

/** A page of the index, the shape the server sends one in. */
export function page(data: Character[], meta: Partial<CharacterList["meta"]> = {}): CharacterList {
  return {
    data,
    meta: { page: 1, size: 16, records: data.length, pages: 1, cached: false, ...meta },
  };
}

/** The app, at one address, with a cache of its own. */
export function renderApp(at = "/") {
  const client = new QueryClient({
    defaultOptions: {
      // The app's own shape (src/query.ts), so the tests see the freshness a page
      // really sees. `retry: false` is the one difference: a test that waits for
      // a retry is a test about to time out.
      queries: { staleTime: 60_000, retry: false },
    },
  });

  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}
