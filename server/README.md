# server

The API behind [Wizarding Index](../README.md), and the Cloudflare Worker that
serves the built SPA alongside it — one origin, so the session cookie is
first-party and the app needs no CORS.

## Stack

- TypeScript, run straight by Node: type stripping, no build step, no bundler
- Cloudflare Workers and D1; `wrangler.jsonc` at the repo root owns the bindings
- drizzle-orm for the SQL, with `infrastructure/d1/schema.ts` as its types
- Better Auth for passwords, sessions and the cookie

## How it is layered

`domain/` is the model, the rules and the errors, with no I/O. `application/`
holds the use cases over the ports in `ports.ts` — where the async creeps in,
because D1 has no synchronous API. `infrastructure/` is the adapters (d1,
potterdb). `http/` is a small router: parse, resolve the caller once, call one
use case, hand the result back. `worker.ts` wires the lot from the bindings.

## Endpoints

| | |
| --- | --- |
| `GET /api/health` | liveness, and how many migrations the D1 ledger holds |
| `GET /api/me` | the signed-in user, or 401 |
| `GET /api/characters?page=` | one page of the corpus |
| `GET /api/characters/:slug` | one character |
| `GET /api/favorites` | the caller's private list |
| `POST /api/favorites/:characterId` | mark or unmark, and answer with which |
| `GET /api/notes/:characterId` | the caller's note, or null |
| `PUT /api/notes/:characterId` | save it in place — one row per character, no history |
| `/api/auth/*` | Better Auth's own: sign-up, sign-in, sign-out |

## Auth

Better Auth owns `/api/auth/*`. The instance is built per request, so the origin
is the address the request was addressed to: workers.dev, a custom domain and
localhost all work with nothing to configure. The trusted origin comes from the
request's URL, never from its `Origin` header — that header is the thing being
checked, so a stranger's page is answered 403. Sign-in and sign-up are
rate-limited in D1 rather than in isolate memory, and a daily cron takes expired
sessions away.

`BETTER_AUTH_SECRET` is the only configuration: `wrangler secret put` in
production, `.dev.vars` locally. Passwords are hashed with scrypt, which costs
more CPU than the free plan's 10 ms per request allows — register and sign-in
want Workers Paid.

## Data

`migrations/*.sql` is the source of truth, applied by wrangler and recorded in
D1's own `d1_migrations` ledger. `schema.ts` is the drizzle mirror of those
files, and `test/schema.test.ts` fails when the two drift apart.

```bash
npm run db:migrate:local   # the local D1 in .wrangler/state
npm run db:migrate         # the deployed one
npm run db:shell           # a SQL prompt against the deployed one
```

## Tests

```bash
npm --prefix server test        # node:test
npm --prefix server run typecheck
```

The tests use the real thing: real D1 through miniflare's `getPlatformProxy`,
real drizzle, real Better Auth. Only PotterDB is faked. `test/harness.ts` hands
back a world — the app, the services, a registered user — and files run one at a
time, since a runtime per test means twenty workerd processes at once.

The typecheck regenerates `worker-configuration.d.ts` first: the `Env` type is
generated from `wrangler.jsonc`, and it is gitignored.
