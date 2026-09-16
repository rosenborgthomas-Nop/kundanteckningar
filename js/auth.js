/**
 * Lokal upplåsning — lösenord öppnar den krypterade databasen.
 */
import {
  changeDatabasePassword,
  createDatabaseWithPassword,
  isDatabaseInitialized,
  isUnlocked,
  lockDatabase,
  restoreSessionIfPossible,
  unlockDatabase,
  wipeLocalDatabase,
} from "./db.js";

const LOGIN_PATH = "Inloggning.html";

export function authErrorMessage(error) {
  if (!error) return "Något gick fel.";
  if (typeof error === "string") return error;
  return error.message || "Något gick fel.";
}

export async function waitForAuth() {
  if (isUnlocked()) return { local: true };
  try {
    if (await restoreSessionIfPossible()) return { local: true };
  } catch (_) {
    /* ignore */
  }
  return null;
}

export function getCurrentUser() {
  return isUnlocked() ? { local: true } : null;
}

export function onAuthChange(callback) {
  callback(getCurrentUser());
  return () => {};
}

export async function requireAuth(loginPath) {
  if (!isUnlocked()) {
    try {
      await restoreSessionIfPossible();
    } catch (_) {
      /* ignore */
    }
  }
  if (!isUnlocked()) {
    window.location.replace(loginPath || LOGIN_PATH);
    return null;
  }
  return getCurrentUser();
}

/** Kräv upplåst lokal databas. */
export async function requireJournalAccess(loginPath) {
  return requireAuth(loginPath);
}

export async function needsSetup() {
  return !(await isDatabaseInitialized());
}

export async function setupPassword(password, passwordRepeat) {
  if (password !== passwordRepeat) {
    throw new Error("Lösenorden matchar inte.");
  }
  await createDatabaseWithPassword(password);
  return getCurrentUser();
}

export async function logIn(_emailIgnored, password) {
  await unlockDatabase(password);
  return getCurrentUser();
}

export async function unlockWithPassword(password) {
  await unlockDatabase(password);
  return getCurrentUser();
}

export async function signUp() {
  throw new Error("Kontoskapande via e-post används inte längre.");
}

export async function logOut() {
  await lockDatabase();
}

export async function resetPassword() {
  throw new Error(
    "Glömt lösenord: det finns ingen återställning via e-post. " +
      "Du kan radera lokal data och skapa ett nytt lösenord (all kunddata försvinner)."
  );
}

export async function changePassword(currentPassword, newPassword) {
  await changeDatabasePassword(currentPassword, newPassword);
}

export async function factoryResetLocalData() {
  await wipeLocalDatabase();
}
