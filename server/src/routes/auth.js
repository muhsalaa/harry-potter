import { Router } from "express";

import { createSession, destroySession, requireUser } from "../auth.js";
import { clearSessionCookie, setSessionCookie, verifyPassword, hashPassword } from "../session.js";

const MIN_PASSWORD = 8;

/** Returns a message naming what is wrong, or null. */
function validate({ email, password }) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "That email address is not one an address could have.";
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return `Passwords here are at least ${MIN_PASSWORD} characters.`;
  }
  return null;
}

export function authRouter(db) {
  const router = Router();

  router.post("/auth/register", async (req, res, next) => {
    try {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      const problem = validate({ email, password });
      if (problem) {
        res.status(400).json({ error: problem });
        return;
      }

      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        res.status(409).json({ error: "That email already has an account. Sign in instead." });
        return;
      }

      const { lastInsertRowid } = db
        .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email, await hashPassword(password));

      setSessionCookie(res, createSession(db, Number(lastInsertRowid)));
      res.status(201).json({ user: { id: Number(lastInsertRowid), email } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/login", async (req, res, next) => {
    try {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email);

      // Same message either way: which half was wrong is not the caller's business.
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        res.status(401).json({ error: "That email and password do not match an account." });
        return;
      }

      setSessionCookie(res, createSession(db, user.id));
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/logout", (req, res) => {
    // Deleting the row is what revokes: the cookie alone never proved anything.
    if (req.sessionToken) destroySession(db, req.sessionToken);
    clearSessionCookie(res);
    res.status(204).end();
  });

  router.get("/me", requireUser, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
