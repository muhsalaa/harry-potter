# 04 — Favorite a Character, privately

**What to build:** a logged-in User can mark a Character as a Favorite and unmark it again. The toggle appears both on the card in the list and on the Character's own page. A Favorite is private: it belongs to that User, no other User ever sees it, and no count of anyone's Favorites is displayed anywhere — not on a card, not on a page, not in an API response (ADR-0002). A `/favorites` page lists the User's Favorited Characters, each showing whether it also carries a Note. The character list and detail responses report whether the current viewer has Favorited each Character, so the state survives a refresh rather than living only in the browser. A logged-out visitor sees the control inviting them to log in instead of a button that silently fails — and browsing stays fully usable.

**Blocked by:** #02 — Browse and read any Character, #03 — Register, log in, log out

**Status:** ready-for-agent

Uses migration `003` (favorites), with `UNIQUE(user_id, character_id)`.

- [ ] Favoriting then unfavoriting a Character leaves zero rows for that User and Character
- [ ] Favoriting the same Character twice cannot produce a second row
- [ ] The Favorite state is correct after a page refresh, and is not held only in client state
- [ ] `/favorites` lists the User's Favorited Characters and shows a Note indicator per Character
- [ ] A second User sees none of the first User's Favorites, and no endpoint leaks another User's Favorite set or a count of it
- [ ] Logged out, the control offers login and the list and detail pages still work
- [ ] Two different Users favoriting the same Character are recorded independently
