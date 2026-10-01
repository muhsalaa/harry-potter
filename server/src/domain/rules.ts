import { invalid } from "./errors.ts";

/**
 * The floor Better Auth enforces on a new password. It is also the sentence the
 * register page prints, so the two cannot disagree.
 */
export const MIN_PASSWORD = 8;
export const NOTE_LIMIT = 1000;

/** Throws on an unusable note body; returns the text worth keeping. */
export function checkNoteBody(raw: string): string {
  const body = raw.trim();

  if (body.length === 0) {
    throw invalid("An empty note is not worth keeping. Write something first.");
  }
  if (body.length > NOTE_LIMIT) {
    throw invalid(`Notes stop at ${NOTE_LIMIT} characters. Yours is ${body.length}.`);
  }

  return body;
}
