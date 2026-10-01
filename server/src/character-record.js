/**
 * The single translation point between PotterDB's attribute names and our
 * column names. Everything else in the server speaks our names.
 */
export function toRow(character, { page = null, index = null } = {}) {
  return {
    potterdb_id: character.potterdbId,
    slug: character.slug,
    name: character.name,
    image: character.image,
    house: character.house,
    blood_status: character.bloodStatus,
    species: character.species,
    gender: character.gender,
    born: character.born,
    died: character.died,
    eye_color: character.eyeColor,
    hair_color: character.hairColor,
    skin_color: character.skinColor,
    height: character.height,
    weight: character.weight,
    nationality: character.nationality,
    marital_status: character.maritalStatus,
    patronus: character.patronus,
    boggart: character.boggart,
    animagus: character.animagus,
    alias_names: JSON.stringify(character.aliasNames ?? []),
    family_members: JSON.stringify(character.familyMembers ?? []),
    jobs: JSON.stringify(character.jobs ?? []),
    romances: JSON.stringify(character.romances ?? []),
    titles: JSON.stringify(character.titles ?? []),
    wands: JSON.stringify(character.wands ?? []),
    wiki: character.wiki,
    list_page: page,
    list_index: index,
  };
}

function parseList(value) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The shape the API hands the frontend: ours, not PotterDB's. */
export function toApi(row, viewerState) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.image,
    house: row.house,
    bloodStatus: row.blood_status,
    species: row.species,
    gender: row.gender,
    born: row.born,
    died: row.died,
    eyeColor: row.eye_color,
    hairColor: row.hair_color,
    skinColor: row.skin_color,
    height: row.height,
    weight: row.weight,
    nationality: row.nationality,
    maritalStatus: row.marital_status,
    patronus: row.patronus,
    boggart: row.boggart,
    animagus: row.animagus,
    aliasNames: parseList(row.alias_names),
    familyMembers: parseList(row.family_members),
    jobs: parseList(row.jobs),
    romances: parseList(row.romances),
    titles: parseList(row.titles),
    wands: parseList(row.wands),
    wiki: row.wiki,
    cachedAt: row.cached_at,
    ...(viewerState ? { viewer: viewerState } : {}),
  };
}
