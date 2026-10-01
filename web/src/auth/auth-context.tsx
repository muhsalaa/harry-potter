import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { currentUser, signIn as apiSignIn, signOut as apiSignOut, register as apiRegister } from "../api/auth";
import type { User } from "../api/auth";
import { keys } from "../query";

/**
 * How far the session read has got. "checking" is not a third kind of reader —
 * it is the absence of an answer yet, and every mark on the page waits for it.
 */
export type Status = "checking" | "anonymous" | "authenticated";

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/**
 * The session is server state like any other, so it lives in the same cache: the
 * session query answers who we are, and the three actions write the answer back
 * rather than keeping a second copy in component state. `status` is a view of
 * that query — "checking" is simply "no answer yet".
 *
 * The session itself never goes stale on its own: it changes only when one of
 * these actions changes it, and the cache is told when that happens.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();

  const session = useQuery({
    queryKey: keys.session(),
    queryFn: currentUser,
    staleTime: Infinity,
  });

  // An unanswered or failed session read is a reader who is not signed in: the
  // API answers 401 for that case, and currentUser() turns it into null.
  const status: Status = session.isPending ? "checking" : session.data ? "authenticated" : "anonymous";

  /**
   * A session read may still be on its way when credentials arrive — the sign-in
   * form does not wait for it. Cancel it before writing: an answer that landed
   * after this write would put the session we just replaced back, and the reader
   * would be signed out on screen until the next reload.
   */
  const remember = useCallback(
    async (found: User | null) => {
      await client.cancelQueries({ queryKey: keys.session() });
      client.setQueryData(keys.session(), found);
    },
    [client],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: found } = await apiSignIn(email, password);
      await remember(found);
    },
    [remember],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const { user: found } = await apiRegister(email, password);
      await remember(found);
    },
    [remember],
  );

  const signOut = useCallback(async () => {
    await apiSignOut();
    await remember(null);
    // Whoever signs in next must not inherit a cache entry that carries the
    // marks of the account that just left, even though keys are viewer-scoped.
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== keys.session()[0] });
  }, [client, remember]);

  const value = useMemo(
    () => ({ status, user: session.data ?? null, signIn, register, signOut }),
    [status, session.data, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth was called outside AuthProvider.");
  return value;
}

