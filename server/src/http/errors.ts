import { AppError } from "../domain/errors.ts";
import type { ErrorKind } from "../domain/errors.ts";

const STATUS: Record<ErrorKind, number> = {
  invalid: 400,
  unauthorized: 401,
  "not-found": 404,
  conflict: 409,
};

/**
 * The one place a failure becomes a status code. A domain failure is the
 * caller's to fix and is answered with its message; anything else is ours, is
 * logged, and is answered with a 502 so the two are never confused.
 */
export function failure(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: error.message }, { status: STATUS[error.kind] });
  }

  console.error(error);

  return Response.json(
    { error: error instanceof Error ? error.message : "The request failed." },
    { status: 502 },
  );
}
