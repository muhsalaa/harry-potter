import { request } from "./client";

export type Note = {
  body: string;
  updatedAt: string;
};

export const getNote = async (characterId: number) =>
  (await request<{ note: Note | null }>(`/api/notes/${characterId}`)).note;

export const saveNote = async (characterId: number, body: string) =>
  (
    await request<{ note: Note }>(`/api/notes/${characterId}`, {
      method: "PUT",
      body: JSON.stringify({ body }),
    })
  ).note;

export const NOTE_LIMIT = 1000;
