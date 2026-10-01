# 01 — Walking skeleton: shell, same-origin API, migration runner

**What to build:** `npm run dev` at the repo root boots the Express backend and the Vite frontend together, with Vite proxying the API so the browser only ever sees one origin — cookies then just work and CORS never enters the picture. Opening `/` shows the result of `GET /api/health` rendered on screen, proving one round trip through every layer (router → API client → Express → response → React). The SQLite file is created on boot by a numbered migration runner that records which migrations have run. The frontend route table is pre-declared with stub pages for `/`, `/characters/:slug`, `/login`, `/register`, and `/favorites`, and the nav shell renders a logged-out state by default.

This ticket deliberately owns every file that more than one later ticket would otherwise need to edit: the route table, the layout shell, the shared API client, the migration runner, and one stub slot component per future feature. Each later slice fills in its own component and its own API module, so two tickets can be worked at the same time without touching the same file.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Conventions this ticket establishes, which every later ticket depends on:

- **Migration numbering is pre-assigned so parallel tickets never collide:** this feature's auth tables are `001`, characters are `002`, favorites are `003`, notes are `004`. A slice adds exactly one migration file with its assigned number and never edits another slice's migration.
- **One API module per slice**, created by the slice that needs it, over the shared request helper created here.
- **Slot components**: the character detail page is composed of a favorite control slot and a note panel slot; the character list page has a toolbar slot. Each slot ships here as a placeholder that renders nothing, and the owning slice replaces just that file.

- [ ] One command starts backend and frontend together; the frontend reaches the API through the proxy on its own origin
- [ ] `/` displays the live health response — not a hardcoded string
- [ ] The SQLite file and the migrations table are created on boot; re-running boot does not re-run an already-applied migration
- [ ] Every route in the frozen scope (`/`, `/characters/:slug`, `/login`, `/register`, `/favorites`) resolves to a stub page rather than a 404
- [ ] The nav shell renders correctly with no user logged in
