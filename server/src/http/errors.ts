import type { NextFunction, Request, Response } from "express";

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
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(STATUS[error.kind]).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(502).json({ error: error instanceof Error ? error.message : "The request failed." });
}
