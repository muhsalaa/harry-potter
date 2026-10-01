import { ApiError, request } from "./client";

export type User = {
  id: number;
  email: string;
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

export const signIn = (email: string, password: string) =>
  request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (email: string, password: string) =>
  request<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signOut = () => request<void>("/api/auth/logout", { method: "POST" });
