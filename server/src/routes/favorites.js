import { Router } from "express";

import { toApi } from "../character-record.js";
import { requireUser } from "../auth.js";
import { readViewerState } from "../repo/characters.js";

function characterId(req) {
  const id = Number.parseInt(req.params.characterId, 10);
  return Number.isFinite(id) ? id : null;
}

export function favoritesRouter(db) {
  const router = Router();

  router.get("/favorites", requireUser, (req, res) => {
    const rows = db
      .prepare(
        `SELECT c.* FROM favorites f
           JOIN characters c ON c.id = f.character_id
          WHERE f.user_id = ?
          ORDER BY f.created_at DESC, c.name`,
      )
      .all(req.user.id);

    const viewer = readViewerState(db, req.user.id, rows.map((row) => row.id));
    res.json({ data: rows.map((row) => toApi(row, viewer.get(row.id))) });
  });

  /**
   * A toggle, not a create: the pair is the identity, so pressing it twice
   * leaves nothing behind. No count is ever returned — a Favorite is private
   * (ADR-0002).
   */
  router.post("/favorites/:characterId", requireUser, (req, res) => {
    const id = characterId(req);
    const character = id ? db.prepare("SELECT id FROM characters WHERE id = ?").get(id) : null;

    if (!character) {
      res.status(404).json({ error: "No such character." });
      return;
    }

    const existing = db
      .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND character_id = ?")
      .get(req.user.id, id);

    if (existing) {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND character_id = ?").run(req.user.id, id);
    } else {
      db.prepare("INSERT INTO favorites (user_id, character_id) VALUES (?, ?)").run(req.user.id, id);
    }

    res.json({ favorited: !existing });
  });

  return router;
}
