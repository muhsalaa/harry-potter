# 03 — Register, log in, log out

**What to build:** a visitor can create an account with an email and a password and stay logged in across refreshes. `/register` creates a User and lands them logged in. `/login` authenticates an existing one. Passwords are stored hashed, never recoverable. On success the backend creates a session row and sets an httpOnly cookie, and `GET /api/me` lets the shell show who is logged in. Logging out deletes the session row — the cookie alone is not revocation, so a copied cookie must stop working. There is no email verification and no password reset in v1; this is a known, recorded gap rather than a missing detail.

**Blocked by:** #01 — Walking skeleton: shell, same-origin API, migration runner

**Status:** ready-for-agent

Uses migration `001` (users, sessions).

- [ ] Registering a new email lands the User logged in, with the nav reflecting it
- [ ] Registering an email that already exists is rejected with a clear message, not a crash and not a second account
- [ ] Logging in with the wrong password returns a clean failure message and no session
- [ ] Refreshing the page keeps the User logged in
- [ ] `GET /api/me` returns the current User when logged in and an unauthenticated result when not
- [ ] A protected endpoint returns 401 for a request with no session
- [ ] Logging out reverts the nav and makes a request carrying the old cookie fail with 401
- [ ] Stored passwords are hashed, and no endpoint ever returns a password field
