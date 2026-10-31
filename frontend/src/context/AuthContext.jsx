import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./authStore";

const USERS_KEY = "finch.auth.users.v1";
const SESSION_KEY = "finch.auth.session.v1";
const LEGACY_DATA_CLAIMED_KEY = "finch.auth.legacy-data-claimed.v1";
const LEGACY_DATA_KEYS = ["finch.transactions.v1", "finch.budgets.v1", "finch.categories.v1", "finch.settings.v1"];
const ITERATIONS = 310000;

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePassword(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error("Secure password storage is unavailable in this browser. Use localhost or HTTPS.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
  return bytesToBase64(new Uint8Array(derived));
}

function equalHash(left, right) {
  const a = base64ToBytes(left);
  const b = base64ToBytes(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const id = localStorage.getItem(SESSION_KEY);
    return readUsers().find((item) => item.id === id) || null;
  });

  const signUp = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((item) => item.email === normalizedEmail)) throw new Error("An account with this email already exists. Sign in instead.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordSalt: bytesToBase64(salt),
      passwordHash: await derivePassword(password, salt),
      passwordIterations: ITERATIONS,
    };
    if (users.length === 0 && !localStorage.getItem(LEGACY_DATA_CLAIMED_KEY)) {
      for (const key of LEGACY_DATA_KEYS) {
        const legacyValue = localStorage.getItem(key);
        if (legacyValue === null) continue;
        const parsed = JSON.parse(legacyValue);
        const value = key.endsWith(".settings.v1") && parsed && typeof parsed === "object"
          ? { ...parsed, name: account.name, email: account.email }
          : parsed;
        localStorage.setItem(`${key}.${account.id}`, JSON.stringify(value));
      }
      localStorage.setItem(LEGACY_DATA_CLAIMED_KEY, "true");
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, account]));
    localStorage.setItem(SESSION_KEY, account.id);
    setUser(account);
  };

  const signIn = async ({ email, password }) => {
    const account = readUsers().find((item) => item.email === email.trim().toLowerCase());
    if (!account) throw new Error("Email or password is incorrect.");
    const salt = base64ToBytes(account.passwordSalt);
    const hash = await derivePassword(password, salt);
    if (!equalHash(hash, account.passwordHash)) throw new Error("Email or password is incorrect.");
    localStorage.setItem(SESSION_KEY, account.id);
    setUser(account);
  };

  const updateProfile = useCallback(({ name, email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    if (normalizedName.length < 2) throw new Error("Enter a name with at least two characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
    const users = readUsers();
    if (users.some((item) => item.email === normalizedEmail && item.id !== user.id)) {
      throw new Error("An account with this email already exists.");
    }
    const updatedUser = { ...user, name: normalizedName, email: normalizedEmail };
    localStorage.setItem(USERS_KEY, JSON.stringify(users.map((item) => item.id === user.id ? updatedUser : item)));
    setUser(updatedUser);
    return updatedUser;
  }, [user]);

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, signUp, signIn, signOut, updateProfile }), [user, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
