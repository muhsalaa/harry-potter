import { conflict, unauthorized } from "../domain/errors.ts";
import { checkCredentials, normalizeEmail } from "../domain/rules.ts";
import type { User } from "../domain/model.ts";
import type { Dependencies } from "./ports.ts";

/** A User and the cookie token that now stands for them. */
export type SignedIn = { user: User; token: string };

export function createAccounts({ accounts, passwords }: Dependencies) {
  return {
    async register(email: string, password: string): Promise<SignedIn> {
      const address = normalizeEmail(email);
      checkCredentials(address, password);

      if (await accounts.byEmail(address)) {
        throw conflict("That email already has an account. Sign in instead.");
      }

      const user = await accounts.create(address, await passwords.hash(password));
      return { user, token: await accounts.openSession(user.id) };
    },

    async login(email: string, password: string): Promise<SignedIn> {
      const found = await accounts.byEmail(normalizeEmail(email));

      if (!found || !(await passwords.verify(password, found.passwordHash))) {
        throw unauthorized("That email and password do not match an account.");
      }

      return {
        user: { id: found.id, email: found.email },
        token: await accounts.openSession(found.id),
      };
    },

    /** Signing out twice is not an error: no token means nothing to revoke. */
    async logout(token: string | null): Promise<void> {
      if (token) await accounts.closeSession(token);
    },

    /** The User behind a cookie token, or nobody. An absent token is not an error. */
    async resolve(token: string | null): Promise<User | null> {
      return token ? accounts.resolveSession(token) : null;
    },
  };
}
