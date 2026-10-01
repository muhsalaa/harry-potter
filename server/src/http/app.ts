import express from "express";
import type { Express } from "express";

import type { Services } from "../application/services.ts";
import { errorHandler } from "./errors.ts";
import { authRouter } from "./routes/auth.ts";
import { charactersRouter } from "./routes/characters.ts";
import { favoritesRouter } from "./routes/favorites.ts";
import { healthRouter } from "./routes/health.ts";
import { notesRouter } from "./routes/notes.ts";
import { attachUser } from "./session.ts";

/**
 * The transport adapter: it parses requests, calls one use case, and hands the
 * result back. Status codes come from the error handler, never from a route.
 */
export function createApp(services: Services): Express {
  const app = express();

  app.use(express.json());
  app.use(attachUser((token) => services.accounts.resolve(token)));

  app.use("/api", healthRouter(services));
  app.use("/api", authRouter(services));
  app.use("/api", charactersRouter(services));
  app.use("/api", favoritesRouter(services));
  app.use("/api", notesRouter(services));

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "No such endpoint." });
  });

  app.use(errorHandler);

  return app;
}
