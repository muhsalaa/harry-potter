import { invalid } from "./errors.ts";

export const MIN_PASSWORD = 8;
export const NOTE_LIMIT = 1000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Addresses are unique NOCASE in the database, so they are compared lowercase. */
export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

/** Throws naming the first problem with these credentials; returns quietly when both hold. */
export function checkCredentials(email: string, password: string): void {
  if (!EMAIL.test(email)) {
    throw invalid("That email address is not one an address could have.");
  }
  if (password.length < MIN_PASSWORD) {
    throw invalid(`Passwords here are at least ${MIN_PASSWORD} characters.`);
  }
}

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
