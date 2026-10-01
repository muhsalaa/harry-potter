# Wizarding Index

Every character in the [PotterDB](https://potterdb.com) corpus, browsable a page
at a time, with a private list and one private note per character.

## Run it

```bash
npm install && npm --prefix server install && npm --prefix web install
npm run dev            # api on :3000, web on :5173 (proxied, one origin)
```

Open http://localhost:5173. The database file and every table are created on
first boot; character pages are fetched from PotterDB the first time you view
them, then served from SQLite.

## Check it

```bash
npm test               # server tests, then the token/contrast gate, then tsc
```

## Layout

- `server/` — TypeScript, layered: `src/domain` (rules and translations), `src/application` (use cases over ports), `src/infrastructure` (SQLite, PotterDB, scrypt), `src/http` (Express). No build step, no ORM.
- `web/` — Vite + React + Tailwind; every colour lives in `web/src/styles/tokens.css`
- `CONTEXT.md` — glossary (Character, Favorite, Note)
- `docs/adr/` — why the corpus is mirrored locally, and why nothing here is public
- `.scratch/character-portal/issues/` — the tickets this was built from

Not affiliated with Warner Bros. Discovery. Character data belongs to PotterDB.
