import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { ScryptOptions } from "node:crypto";

import type { Passwords } from "../../application/ports.ts";

const KEY_LENGTH = 64;
const PARAMS: ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/** Salted scrypt, written as one string: `scrypt$salt$key`. */
export const scryptPasswords: Passwords = {
  async hash(password) {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, KEY_LENGTH, PARAMS);

    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  },

  async verify(password, stored) {
    const [scheme, saltHex, keyHex] = String(stored ?? "").split("$");
    if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

    const key = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH, PARAMS);
    const expected = Buffer.from(keyHex, "hex");

    return key.length === expected.length && timingSafeEqual(key, expected);
  },
};
