import { ApiError, request } from "./client";

/** A reader, as Better Auth keeps them: a uuid id, an address, a display name. */
export type User = {
  id: string;
  email: string;
  name?: string;
};

/** Anonymous is the normal state, not a failure — so 401 resolves to null. */
export async function currentUser(): Promise<User | null> {
  try {
    return (await request<{ user: User }>("/api/me")).user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/**
 * The three doors, as Better Auth's own endpoints. The session cookie, the
 * password hash and the rate limits behind them are its business; this file
 * only names the paths, so a page keeps calling `signIn(email, password)`.
 */
export const signIn = (email: string, password: string) =>
  request<{ user: User }>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

/**
 * Better Auth requires a name at sign-up and the form asks for two things, so
 * the local part of the address stands in for it.
 */
export const register = (email: string, password: string) =>
  request<{ user: User }>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name: email.split("@")[0] || "reader" }),
  });

export const signOut = () =>
  request<{ success: boolean }>("/api/auth/sign-out", { method: "POST", body: "{}" });
