import { Router } from "express";

export function healthRouter(db) {
  const router = Router();

  router.get("/health", (_req, res) => {
    const applied = db
      .prepare("SELECT name, applied_at FROM schema_migrations ORDER BY name")
      .all();

    res.json({
      ok: true,
      database: {
        migrations: applied.length,
        applied: applied.map((row) => row.name),
      },
      time: new Date().toISOString(),
    });
  });

  return router;
}
