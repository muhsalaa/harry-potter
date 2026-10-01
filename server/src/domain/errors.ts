export type ErrorKind = "invalid" | "unauthorized" | "conflict" | "not-found";

/**
 * A failure the caller caused and can fix. Anything else is a bug or an outage,
 * and the HTTP layer answers those without a message from here.
 */
export class AppError extends Error {
  readonly kind: ErrorKind;

  constructor(kind: ErrorKind, message: string) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
  }
}

export const invalid = (message: string) => new AppError("invalid", message);
export const unauthorized = (message: string) => new AppError("unauthorized", message);
export const conflict = (message: string) => new AppError("conflict", message);
export const notFound = (message: string) => new AppError("not-found", message);
