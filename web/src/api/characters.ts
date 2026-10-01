import { request } from "./client";

export type ViewerState = {
  favorited: boolean;
  hasNote: boolean;
};

export type Character = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  house: string | null;
  bloodStatus: string | null;
  species: string | null;
  gender: string | null;
  born: string | null;
  died: string | null;
  eyeColor: string | null;
  hairColor: string | null;
  skinColor: string | null;
  height: string | null;
  weight: string | null;
  nationality: string | null;
  maritalStatus: string | null;
  patronus: string | null;
  boggart: string | null;
  animagus: string | null;
  aliasNames: string[];
  familyMembers: string[];
  jobs: string[];
  romances: string[];
  titles: string[];
  wands: string[];
  wiki: string | null;
  viewer?: ViewerState;
};

export type CharacterList = {
  data: Character[];
  meta: {
    page: number;
    size: number;
    records: number;
    pages: number;
    cached: boolean;
  };
};

export const listCharacters = (page: number) =>
  request<CharacterList>(`/api/characters?page=${page}`);

export const getCharacter = async (slug: string) =>
  (await request<{ data: Character }>(`/api/characters/${encodeURIComponent(slug)}`)).data;

export const toggleFavorite = (characterId: number) =>
  request<{ favorited: boolean }>(`/api/favorites/${characterId}`, { method: "POST" });

export const listFavorites = async () =>
  (await request<{ data: Character[] }>("/api/favorites")).data;
