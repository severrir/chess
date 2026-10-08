/**
 * Admin sign-in.
 *
 * This is a gate, not a wall. With no backend the check can only happen in
 * the browser, so a determined student could bypass it by editing their own
 * copy of the page — what it actually protects is the shared data, which
 * lives on whatever device is signed in. Wiring Supabase (see README) moves
 * the real check server-side, where row-level security enforces it.
 *
 * The password is stored as a SHA-256 hash so the plain text is not sitting
 * in the published bundle for anyone who opens the network tab.
 */

const KEY = "chess.admin.v1";

/** sha256("sabuka159") */
const PASSWORD_HASH =
  "d6fc39b469b91aceea5e21da5c45733c9510e5da2dda988bb8bb56647d4a0271";

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

let signedIn = (() => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
})();

export const isAdmin = () => signedIn;

export function subscribeAuth(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

import { isRemote, signInRemote, signOutRemote } from "./backend.js";

/**
 * With a database attached the password check happens server-side against
 * a real account, and chess_admins decides who may write. Without one it
 * falls back to the local hash below, which gates the UI only.
 */
export const REMOTE_AUTH = isRemote;

export async function signIn(password, email) {
  if (isRemote) {
    await signInRemote(email, password);
    signedIn = true;
    try { localStorage.setItem(KEY, "1"); } catch { /* session only */ }
    emit();
    return;
  }
  return signInLocal(password);
}

async function signInLocal(password) {
  const ok = (await sha256(password)) === PASSWORD_HASH;
  if (!ok) throw new Error("პაროლი არ ემთხვევა.");
  signedIn = true;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Session-only sign-in still works.
  }
  emit();
}

export function signOut() {
  if (isRemote) signOutRemote();
  signedIn = false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
  emit();
}
