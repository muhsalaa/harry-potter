import { PAGE_SIZE, toPayload } from "../domain/character.ts";
import { notFound } from "../domain/errors.ts";
import type { CharacterPayload } from "../domain/character.ts";
import type { Dependencies } from "./ports.ts";

export type CharacterPage = {
  data: CharacterPayload[];
  meta: { page: number; size: number; records: number; pages: number; cached: boolean };
};

export function createCharacters({ catalog, characters, personal }: Dependencies) {
  return {
    /** Cache-through: a page the mirror has not seen is fetched once, then served locally. */
    async list(page: number, viewerId: number | null): Promise<CharacterPage> {
      const known = await characters.corpus();
      if (known && page > known.pages) {
        throw notFound(`The corpus has ${known.pages} pages.`);
      }

      let rows = await characters.page(page);
      const cached = rows.length > 0;

      if (!cached) {
        const fresh = await catalog.page(page, PAGE_SIZE);
        await characters.savePage(fresh.characters, fresh.page);
        await characters.saveCorpus(fresh);
        rows = await characters.page(page);
      }

      const corpus = await characters.corpus();
      const viewer = await personal.viewerState(viewerId, rows.map((row) => row.id));

      return {
        data: rows.map((row) => toPayload(row, viewer.get(row.id))),
        meta: {
          page,
          size: PAGE_SIZE,
          records: corpus?.records ?? rows.length,
          pages: corpus?.pages ?? 1,
          cached,
        },
      };
    },

    async bySlug(slug: string, viewerId: number | null): Promise<CharacterPayload> {
      let row = await characters.bySlug(slug);

      if (!row) {
        const fresh = await catalog.bySlug(slug);
        if (!fresh) throw notFound("No such character.");
        row = await characters.saveOne(fresh);
      }

      const viewer = await personal.viewerState(viewerId, [row.id]);
      return toPayload(row, viewer.get(row.id));
    },
  };
}
