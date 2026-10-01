# web

The browser half of [Wizarding Index](../README.md): the browsing pages, the
private list, the note editor, and signing up and in.

## Run it

From the repo root, `npm run dev` starts this and the API together. On its own:

```bash
npm --prefix web run dev   # vite on :5173
```

The browser only ever talks to :5173 — `/api` is proxied to the API on :3000, so
there is one origin and the session cookie is first-party.

## Stack

React 19 · Vite 8 · react-router 8 · TanStack Query 5 · Tailwind 4 · TypeScript.
Vitest 5 with Testing Library and jsdom, oxlint. The API is reached through
`src/api/` and nowhere else — relative `/api` paths, and no client library.

## Where things live

- `src/api/` — one module per resource; `client.ts` is the only `fetch` in the app
- `src/query.ts` — the query keys and the signed-in viewer, in one place
- `src/auth/auth-context.tsx` — the session, as react-query state
- `src/pages/` and `src/components/` — what `src/routes.tsx` renders
- `src/styles/tokens.css` — every colour in the app

## Tests

```bash
npm --prefix web test          # both projects
npm --prefix web run test:unit # colocated: src/**/*.test.tsx
npm --prefix web run test:integration
```

Unit tests sit beside the module they describe. Integration tests render the
real pages and drive them through the real routes with `fetch` stubbed; neither
reaches the network.

```bash
npm --prefix web run check:tokens
```

The design gate. It fails on a colour literal anywhere outside `tokens.css`,
checks each text role's contrast against every surface it can sit on (oklch →
sRGB → WCAG), and holds the three values `index.html` must duplicate — the
theme-colour meta, the pre-CSS background and the favicon — to the tokens they
copy.

## Deploy

Nothing separate: the root `npm run deploy` builds `web/dist`, and the Worker
serves it.
