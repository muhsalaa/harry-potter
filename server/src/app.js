import express from "express";

import { attachUser } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { charactersRouter } from "./routes/characters.js";
import { favoritesRouter } from "./routes/favorites.js";
import { healthRouter } from "./routes/health.js";
import { notesRouter } from "./routes/notes.js";

export function createApp({ db }) {
  const app = express();

  app.use(express.json());
  app.use(attachUser(db));

  app.use("/api", healthRouter(db));
  app.use("/api", authRouter(db));
  app.use("/api", charactersRouter(db));
  app.use("/api", favoritesRouter(db));
  app.use("/api", notesRouter(db));

  app.use("/api", (_req, res) => res.status(404).json({ error: "No such endpoint." }));

  // A thrown route lands here rather than in the browser as an HTML stack trace.
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(502).json({ error: error instanceof Error ? error.message : "The request failed." });
  });

  return app;
}
