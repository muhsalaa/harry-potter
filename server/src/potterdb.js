const BASE = process.env.POTTERDB_BASE_URL ?? "https://api.potterdb.com/v1";

export const PAGE_SIZE = 24;

/** The PotterDB attribute names are snake_case and its paging key is `last`. */
function toCharacter(entry) {
  const a = entry.attributes;
  return {
    potterdbId: entry.id,
    slug: a.slug,
    name: a.name,
    image: a.image,
    house: a.house,
    bloodStatus: a.blood_status,
    species: a.species,
    gender: a.gender,
    born: a.born,
    died: a.died,
    eyeColor: a.eye_color,
    hairColor: a.hair_color,
    skinColor: a.skin_color,
    height: a.height,
    weight: a.weight,
    nationality: a.nationality,
    maritalStatus: a.marital_status,
    patronus: a.patronus,
    boggart: a.boggart,
    animagus: a.animagus,
    aliasNames: a.alias_names ?? [],
    familyMembers: a.family_members ?? [],
    jobs: a.jobs ?? [],
    romances: a.romances ?? [],
    titles: a.titles ?? [],
    wands: a.wands ?? [],
    wiki: a.wiki,
  };
}

async function getJson(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/vnd.api+json" },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`PotterDB answered ${response.status} for ${path}.`);
  }

  return response.json();
}

export async function fetchCharacterPage(page, size = PAGE_SIZE) {
  const body = await getJson(`/characters?page[number]=${page}&page[size]=${size}`);
  const pagination = body.meta.pagination;

  return {
    characters: body.data.map(toCharacter),
    records: pagination.records,
    pages: pagination.last,
    page: pagination.current,
  };
}

export async function fetchCharacterBySlug(slug) {
  const body = await getJson(`/characters/${encodeURIComponent(slug)}`);
  return body ? toCharacter(body.data) : null;
}
