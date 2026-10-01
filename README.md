# Wizarding Index

Every character in the [PotterDB](https://potterdb.com) corpus, browsable a page
at a time, with a private list and one private note per character.

## Run it

```bash
npm install && npm --prefix server install && npm --prefix web install
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .dev.vars   # local secrets, gitignored
npm run build              # web/dist — wrangler serves it in dev too
npm run db:migrate:local   # a fresh local D1 has no tables yet
npm run dev                # api on :3000, web on :5173 (proxied, one origin)
```

Open http://localhost:5173. Character pages come from PotterDB the first time
you view them, and from D1 after that.

## Check it

```bash
npm test   # server tests and typecheck, then web tests, token gate and typecheck
```

## Deploy it

One Worker serves the SPA and the API, so the browser only ever talks to one
origin and the session cookie is first-party.

```bash
npx wrangler login
openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
npm run db:migrate   # against the remote D1
npm run deploy       # builds web/dist, then wrangler deploy
```

`wrangler.jsonc` already names a D1 database. On a different account,
`npx wrangler d1 create portal-db` and put the id it prints in place of the one
there.

## Layout

- [`web/`](web/README.md) — the SPA: Vite, React, Tailwind
- [`server/`](server/README.md) — the API and the Worker: TypeScript, D1, drizzle, Better Auth
- `CONTEXT.md` — glossary (Character, Favorite, Note)
- `docs/adr/` — why the corpus is mirrored locally, and why nothing here is public

Not affiliated with Warner Bros. Discovery. Character data belongs to PotterDB.
