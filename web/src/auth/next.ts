import { useSearchParams } from "react-router";

/** Where a reader lands who gave us nowhere to come back to. */
const DEFAULT = "/favorites";

/** Only same-site paths: a `next` that leaves the app is not honoured. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : DEFAULT;
}

/**
 * The two doors into an account, both returning the reader to `next` afterwards.
 * The guard lives inside them, so a link cannot be built without it: the only
 * `next` that reaches a url is one that stays in the app. Callers name a
 * destination, never a query string.
 */
export const signInHref = (next: string | null): string =>
  `/login?next=${encodeURIComponent(safeNext(next))}`;

export const signUpHref = (next: string | null): string =>
  `/register?next=${encodeURIComponent(safeNext(next))}`;

/** The `?next=` this page was opened with, guarded: where a signed-in reader is owed. */
export function useNextDestination(): string {
  const [params] = useSearchParams();
  return safeNext(params.get("next"));
}
