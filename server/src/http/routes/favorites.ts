import { Router } from "express";

import type { Services } from "../../application/services.ts";
import { signedIn } from "../session.ts";

function characterId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

export function favoritesRouter(services: Services): Router {
  const router = Router();

  router.get("/favorites", (req, res) => {
    res.json(services.personal.listFavorites(signedIn(req).id));
  });

  router.post("/favorites/:characterId", (req, res) => {
    const id = characterId(req.params.characterId);
    res.json(services.personal.toggleFavorite(signedIn(req).id, id));
  });

  return router;
}
