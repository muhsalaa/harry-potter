import { Router } from "express";

import { toApi } from "../character-record.js";
import { PAGE_SIZE, fetchCharacterBySlug, fetchCharacterPage } from "../potterdb.js";
import {
  readCharacterBySlug,
  readCorpus,
  readPage,
  readViewerState,
  saveCharacter,
  saveCorpus,
  savePage,
} from "../repo/characters.js";

const notFound = (res) => res.status(404).json({ error: "No such character." });

export function charactersRouter(db) {
  const router = Router();

  router.get("/characters", async (req, res, next) => {
    try {
      const requested = Number.parseInt(String(req.query.page ?? "1"), 10);
      const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

      const known = readCorpus(db);
      if (known && page > known.pages) {
        res.status(404).json({ error: `The corpus has ${known.pages} pages.` });
        return;
      }

      let rows = readPage(db, page);
      let cached = true;

      if (rows.length === 0) {
        cached = false;
        const fresh = await fetchCharacterPage(page);
        savePage(db, fresh.characters, fresh.page);
        saveCorpus(db, { records: fresh.records, pages: fresh.pages });
        rows = readPage(db, page);
      }

      const corpus = readCorpus(db);
      const viewer = readViewerState(db, req.user?.id, rows.map((row) => row.id));

      res.json({
        data: rows.map((row) => toApi(row, viewer.get(row.id))),
        meta: {
          page,
          size: PAGE_SIZE,
          records: corpus?.records ?? rows.length,
          pages: corpus?.pages ?? 1,
          cached,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/characters/:slug", async (req, res, next) => {
    try {
      const { slug } = req.params;
      let row = readCharacterBySlug(db, slug);

      if (!row) {
        const fresh = await fetchCharacterBySlug(slug);
        if (!fresh) {
          notFound(res);
          return;
        }
        row = saveCharacter(db, fresh);
      }

      const viewer = readViewerState(db, req.user?.id, [row.id]);
      res.json({ data: toApi(row, viewer.get(row.id)) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
