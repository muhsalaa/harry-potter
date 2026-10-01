import { Router } from "express";

import type { Services } from "../../application/services.ts";
import { caller } from "../session.ts";

function pageNumber(raw: unknown): number {
  const requested = Number.parseInt(String(raw ?? "1"), 10);
  return Number.isFinite(requested) && requested > 0 ? requested : 1;
}

export function charactersRouter(services: Services): Router {
  const router = Router();

  router.get("/characters", async (req, res) => {
    const page = pageNumber(req.query.page);
    res.json(await services.characters.list(page, caller(req).user?.id ?? null));
  });

  router.get("/characters/:slug", async (req, res) => {
    const { slug } = req.params;
    res.json({ data: await services.characters.bySlug(slug, caller(req).user?.id ?? null) });
  });

  return router;
}
