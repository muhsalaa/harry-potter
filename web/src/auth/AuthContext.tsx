import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { currentUser, signIn as apiSignIn, signOut as apiSignOut, register as apiRegister } from "../api/auth";
import type { User } from "../api/auth";

type Status = "checking" | "anonymous" | "authenticated";

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<User | null>(null);

  // The session lives in a cookie, so the only way to know who we are is to ask.
  useEffect(() => {
    let live = true;

    currentUser()
      .then((found) => {
        if (!live) return;
        setUser(found);
        setStatus(found ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (live) setStatus("anonymous");
      });

    return () => {
      live = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: found } = await apiSignIn(email, password);
    setUser(found);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { user: found } = await apiRegister(email, password);
    setUser(found);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, register, signOut }),
    [status, user, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth was called outside AuthProvider.");
  return value;
}
