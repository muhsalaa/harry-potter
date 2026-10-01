# 05 — Write a Note on a Character, privately

**What to build:** on a Character's page, a logged-in User can write a private Note about that Character — at most one per User and Character. An empty Character page shows a clear empty state; saving creates the Note; saving again overwrites that same Note in place, so the Note has a current value and no history. The Note belongs to its author and is only ever returned to them: no other User can read it, and no count or excerpt of anyone's Notes appears anywhere. There is no delete and no edit concept — saving the Note is the only write. Length is capped and the cap is enforced by the server, not only the browser. A logged-out visitor sees the panel inviting them to log in.

**Blocked by:** #02 — Browse and read any Character, #03 — Register, log in, log out

**Status:** ready-for-agent

Uses migration `004` (notes), with `UNIQUE(user_id, character_id)`.

- [ ] A logged-in User sees an empty state on a Character with no Note of their own
- [ ] Saving writes one Note; saving again updates that same row and the displayed text changes
- [ ] Saving repeatedly never produces a second Note for the same User and Character
- [ ] Two Users' Notes on the same Character are independent, and neither can read the other's
- [ ] No endpoint returns a Note to anyone other than its author, and no endpoint returns a count of Notes for a Character
- [ ] A Note longer than the cap is rejected by the server, not just prevented in the browser
- [ ] Logged out, the panel offers login and the Character page still works
- [ ] Returning to the Character later shows the User's own saved Note
