import { Router } from "express";

import { requireUser } from "../auth.js";

export const NOTE_LIMIT = 1000;

export function notesRouter(db) {
  const router = Router();

  router.get("/notes/:characterId", requireUser, (req, res) => {
    const id = Number.parseInt(req.params.characterId, 10);
    const note = db
      .prepare("SELECT body, updated_at FROM notes WHERE user_id = ? AND character_id = ?")
      .get(req.user.id, id);

    res.json({ note: note ? { body: note.body, updatedAt: note.updated_at } : null });
  });

  /**
   * One row per User and Character, so this is a save, not an append: saving
   * again overwrites in place. There is no delete and no history.
   */
  router.put("/notes/:characterId", requireUser, (req, res) => {
    const id = Number.parseInt(req.params.characterId, 10);
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

    const character = Number.isFinite(id)
      ? db.prepare("SELECT id FROM characters WHERE id = ?").get(id)
      : null;
    if (!character) {
      res.status(404).json({ error: "No such character." });
      return;
    }

    if (body.length === 0) {
      res.status(400).json({ error: "An empty note is not worth keeping. Write something first." });
      return;
    }

    // Enforced here, not only in the browser — the browser is not the boundary.
    if (body.length > NOTE_LIMIT) {
      res.status(400).json({ error: `Notes stop at ${NOTE_LIMIT} characters. Yours is ${body.length}.` });
      return;
    }

    db.prepare(
      `INSERT INTO notes (user_id, character_id, body) VALUES (?, ?, ?)
       ON CONFLICT (user_id, character_id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`,
    ).run(req.user.id, id, body);

    const saved = db
      .prepare("SELECT body, updated_at FROM notes WHERE user_id = ? AND character_id = ?")
      .get(req.user.id, id);

    res.json({ note: { body: saved.body, updatedAt: saved.updated_at } });
  });

  return router;
}
