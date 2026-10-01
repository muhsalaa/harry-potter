import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
// scrypt is in the standard library: a password hasher with no dependency to
// audit and no native module to compile.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = String(stored ?? "").split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const key = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH, SCRYPT_PARAMS);
  const expected = Buffer.from(keyHex, "hex");

  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const newSessionToken = () => randomBytes(32).toString("hex");

// The database stores only this, so a leaked dump holds no usable session.
export const hashSessionToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const SESSION_COOKIE = "portal_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cookieAttributes(maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(res, token) {
  res.append("Set-Cookie", `${SESSION_COOKIE}=${token}${cookieAttributes(MAX_AGE_SECONDS)}`);
}

export function clearSessionCookie(res) {
  res.append("Set-Cookie", `${SESSION_COOKIE}=${cookieAttributes(0)}`);
}

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }

  return null;
}
