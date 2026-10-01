import { Router } from "express";

import type { Services } from "../../application/services.ts";

export function healthRouter(services: Services): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json(services.health.status());
  });

  return router;
}
