# 02 — Browse and read any Character

**What to build:** a visitor who has never logged in can browse the whole PotterDB corpus and open any Character. `/` lists Characters 24 per page, fetched live from PotterDB and cached into a local `characters` table the first time a page is viewed — upserting on the PotterDB id, per ADR-0001 — so the second visit to that page is served locally instead of re-fetched. Pagination is numbered and lives in the URL (`?page=7`): deep-linkable, refresh-safe, and the full corpus is 5410 records across 226 pages. Each card shows image, name, and house, and must handle the corpus honestly — 54% of Characters have no image and 76% no house, so a missing image renders a deliberate placeholder rather than a broken image icon, and a missing house renders as absence rather than the string "null". Clicking a card opens `/characters/:slug` showing the mirrored attributes.

**Blocked by:** #01 — Walking skeleton: shell, same-origin API, migration runner

**Status:** ready-for-agent

- [ ] `/` lists Characters from the API, 24 per page, in PotterDB's stable order
- [ ] Page 226 renders its partial set and page 227 does not silently render page 226
- [ ] The page number is in the URL; refreshing on `?page=7` stays on page 7 and a pasted URL opens the same page for another visitor
- [ ] A Character with no image shows the placeholder; one with no house shows a clean empty state, never a broken image or a literal `null`
- [ ] First view of a page caches its Characters locally; the second view of that page serves from the local table
- [ ] Every Character read is upserted once — viewing a page twice leaves exactly one row per Character
- [ ] `/characters/:slug` renders the Character's attributes, and an unknown slug returns a not-found page rather than an error screen
- [ ] Browsing works with no session at all
