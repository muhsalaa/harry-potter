import { fromPotterDb } from "../../domain/character.ts";
import type { Character, PotterDbEntry } from "../../domain/character.ts";
import type { Catalog, CatalogPage } from "../../application/ports.ts";

const BASE_URL = process.env.POTTERDB_BASE_URL ?? "https://api.potterdb.com/v1";

type PotterDbPage = {
  data: PotterDbEntry[];
  meta: { pagination: { records: number; last: number; current: number } };
};

export function createPotterDbCatalog(baseUrl: string = BASE_URL): Catalog {
  /** 404 is an answer, not a failure: it is how a slug that does not exist reads. */
  async function getJson(path: string): Promise<unknown> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { accept: "application/vnd.api+json" },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new Error(`PotterDB answered ${response.status} for ${path}.`);
    }

    return response.json();
  }

  return {
    async page(page: number, size: number): Promise<CatalogPage> {
      const body = (await getJson(
        `/characters?page[number]=${page}&page[size]=${size}`,
      )) as PotterDbPage;
      const pagination = body.meta.pagination;

      return {
        characters: body.data.map(fromPotterDb),
        records: pagination.records,
        pages: pagination.last,
        page: pagination.current,
      };
    },

    async bySlug(slug: string): Promise<Character | null> {
      const body = (await getJson(`/characters/${encodeURIComponent(slug)}`)) as {
        data: PotterDbEntry;
      } | null;

      return body ? fromPotterDb(body.data) : null;
    },
  };
}
