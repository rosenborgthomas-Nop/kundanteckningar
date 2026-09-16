/**
 * Lokal krypterad databas.
 * - Android: SQLCipher via @capacitor-community/sqlite
 * - Webbläsare: AES-GCM-krypterad JSON i Preferences (för lokal test)
 */
import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Preferences } from "@capacitor/preferences";

const DB_NAME = "kundanteckningar";
const DB_VERSION = 1;
const META_SETUP_KEY = "ka_db_setup";
const SESSION_KEY = "ka_session_pass";
const WEB_VAULT_KEY = "ka_web_vault";
const WEB_SALT_KEY = "ka_web_salt";

const sqlite = new SQLiteConnection(CapacitorSQLite);
const isWeb = () => Capacitor.getPlatform() === "web";

/** @type {import('@capacitor-community/sqlite').SQLiteDBConnection | WebVaultDb | null} */
let db = null;
let unlocked = false;
let webStoreReady = false;

export function isUnlocked() {
  return unlocked && db != null;
}

function saveSessionPass(password) {
  try {
    sessionStorage.setItem(SESSION_KEY, String(password));
  } catch (_) {
    /* ignore */
  }
}

function readSessionPass() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch (_) {
    return "";
  }
}

export function clearSessionPass() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {
    /* ignore */
  }
}

export async function isDatabaseInitialized() {
  const { value } = await Preferences.get({ key: META_SETUP_KEY });
  return value === "1";
}

async function markInitialized() {
  await Preferences.set({ key: META_SETUP_KEY, value: "1" });
}

export async function clearSetupFlag() {
  await Preferences.remove({ key: META_SETUP_KEY });
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

async function deriveWebKey(password, saltB64) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBuf(saltB64),
      iterations: 120000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPatients(password, saltB64, patients) {
  const key = await deriveWebKey(password, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(patients));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return {
    iv: bufToB64(iv.buffer),
    data: bufToB64(cipher),
  };
}

async function decryptPatients(password, saltB64, vault) {
  const key = await deriveWebKey(password, saltB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(vault.iv) },
    key,
    b64ToBuf(vault.data)
  );
  const text = new TextDecoder().decode(plain);
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

class WebVaultDb {
  constructor(password, saltB64, patients) {
    this.password = password;
    this.saltB64 = saltB64;
    this.patients = patients;
  }

  async persist() {
    const vault = await encryptPatients(
      this.password,
      this.saltB64,
      this.patients
    );
    await Preferences.set({
      key: WEB_VAULT_KEY,
      value: JSON.stringify(vault),
    });
  }

  async execute() {
    return { changes: { changes: 0 } };
  }

  async query(sql) {
    if (/select\s+\*\s+from\s+patients/i.test(sql)) {
      const values = this.patients.map((p) => ({
        id: p.id,
        contact_json: JSON.stringify(p.contact || {}),
        entries_json: JSON.stringify(p.entries || []),
        health_json: p.healthDeclaration
          ? JSON.stringify(p.healthDeclaration)
          : null,
        updated_at: p.updatedAt || new Date().toISOString(),
      }));
      return { values };
    }
    return { values: [] };
  }

  async run(sql, params = []) {
    if (/insert\s+or\s+replace\s+into\s+patients/i.test(sql)) {
      const [id, contactJson, entriesJson, healthJson, updatedAt] = params;
      const row = {
        id,
        contact: JSON.parse(contactJson || "{}"),
        entries: JSON.parse(entriesJson || "[]"),
        healthDeclaration: healthJson ? JSON.parse(healthJson) : null,
        updatedAt,
      };
      const idx = this.patients.findIndex((p) => p.id === id);
      if (idx >= 0) this.patients[idx] = row;
      else this.patients.push(row);
      await this.persist();
      return { changes: { changes: 1 } };
    }
    if (/delete\s+from\s+patients/i.test(sql)) {
      const id = params[0];
      this.patients = this.patients.filter((p) => p.id !== id);
      await this.persist();
      return { changes: { changes: 1 } };
    }
    return { changes: { changes: 0 } };
  }

  async close() {
    this.password = "";
    this.patients = [];
  }
}

async function ensureWebStore() {
  if (webStoreReady) return;
  if (!isWeb()) {
    webStoreReady = true;
    return;
  }
  // Web uses Preferences vault — no jeep-sqlite required for login/data.
  webStoreReady = true;
}

async function ensureSchema(connection) {
  if (isWeb()) return;
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY NOT NULL,
      contact_json TEXT NOT NULL,
      entries_json TEXT NOT NULL,
      health_json TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

async function createWebDatabase(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = bufToB64(salt.buffer);
  await Preferences.set({ key: WEB_SALT_KEY, value: saltB64 });
  const vaultDb = new WebVaultDb(password, saltB64, []);
  await vaultDb.persist();
  db = vaultDb;
  await markInitialized();
  saveSessionPass(password);
  unlocked = true;
  return db;
}

async function unlockWebDatabase(password) {
  const { value: saltB64 } = await Preferences.get({ key: WEB_SALT_KEY });
  const { value: vaultRaw } = await Preferences.get({ key: WEB_VAULT_KEY });
  if (!saltB64 || !vaultRaw) {
    throw new Error("Ingen lokal databas hittades. Skapa ett nytt lösenord.");
  }
  let vault;
  try {
    vault = JSON.parse(vaultRaw);
  } catch (_) {
    throw new Error("Lokal databas är skadad.");
  }
  let patients;
  try {
    patients = await decryptPatients(password, saltB64, vault);
  } catch (_) {
    throw new Error("Fel lösenord eller skadad databas.");
  }
  db = new WebVaultDb(password, saltB64, patients);
  saveSessionPass(password);
  unlocked = true;
  return db;
}

/**
 * Skapa ny krypterad databas med lösenord (första gången).
 */
export async function createDatabaseWithPassword(password) {
  const pass = String(password || "");
  if (pass.length < 8) {
    throw new Error("Lösenordet måste vara minst 8 tecken.");
  }

  await ensureWebStore();

  if (isWeb()) {
    return createWebDatabase(pass);
  }

  await sqlite.setEncryptionSecret(pass);

  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  if (consistency.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      DB_NAME,
      true,
      "secret",
      DB_VERSION,
      false
    );
  }

  await db.open();
  await ensureSchema(db);
  await markInitialized();
  saveSessionPass(pass);
  unlocked = true;
  return db;
}

/**
 * Lås upp befintlig databas med lösenord.
 */
export async function unlockDatabase(password) {
  const pass = String(password || "");
  if (!pass) {
    throw new Error("Ange lösenord.");
  }

  await ensureWebStore();

  if (isWeb()) {
    return unlockWebDatabase(pass);
  }

  try {
    await sqlite.setEncryptionSecret(pass);
  } catch (_) {
    /* secret kan redan vara satt */
  }

  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  if (consistency.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      DB_NAME,
      true,
      "secret",
      DB_VERSION,
      false
    );
  }

  try {
    await db.open();
    await ensureSchema(db);
  } catch (_) {
    unlocked = false;
    db = null;
    try {
      await sqlite.closeConnection(DB_NAME, false);
    } catch (__) {
      /* ignore */
    }
    throw new Error("Fel lösenord eller skadad databas.");
  }

  saveSessionPass(pass);
  unlocked = true;
  return db;
}

/**
 * Återöppna DB från session (ny HTML-sida i samma flik/app).
 */
export async function restoreSessionIfPossible() {
  if (isUnlocked()) return true;
  const pass = readSessionPass();
  if (!pass) return false;
  if (!(await isDatabaseInitialized())) {
    clearSessionPass();
    return false;
  }
  await unlockDatabase(pass);
  return true;
}

/**
 * Byt lösenord.
 */
export async function changeDatabasePassword(currentPassword, newPassword) {
  const next = String(newPassword || "");
  if (next.length < 8) {
    throw new Error("Nytt lösenord måste vara minst 8 tecken.");
  }
  if (next === currentPassword) {
    throw new Error("Nytt lösenord måste skilja sig från det nuvarande.");
  }
  if (!isUnlocked()) {
    throw new Error("Databasen är inte upplåst.");
  }

  if (isWeb()) {
    if (!(db instanceof WebVaultDb)) {
      throw new Error("Databasen är inte upplåst.");
    }
    // Verifiera nuvarande lösenord genom att låsa upp vault igen
    const { value: saltB64 } = await Preferences.get({ key: WEB_SALT_KEY });
    const { value: vaultRaw } = await Preferences.get({ key: WEB_VAULT_KEY });
    const vault = JSON.parse(vaultRaw || "{}");
    try {
      await decryptPatients(String(currentPassword), saltB64, vault);
    } catch (_) {
      throw new Error("Nuvarande lösenord stämmer inte.");
    }
    const patients = db.patients;
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newSaltB64 = bufToB64(newSalt.buffer);
    await Preferences.set({ key: WEB_SALT_KEY, value: newSaltB64 });
    db = new WebVaultDb(next, newSaltB64, patients);
    await db.persist();
    saveSessionPass(next);
    return;
  }

  await sqlite.changeEncryptionSecret(next, String(currentPassword));
  saveSessionPass(next);
}

export async function lockDatabase() {
  unlocked = false;
  clearSessionPass();
  if (!db) return;
  try {
    await db.close();
  } catch (_) {
    /* ignore */
  }
  if (!isWeb()) {
    try {
      await sqlite.closeConnection(DB_NAME, false);
    } catch (_) {
      /* ignore */
    }
  }
  db = null;
}

export function getDb() {
  if (!db || !unlocked) {
    throw new Error("Databasen är låst. Logga in igen.");
  }
  return db;
}

/** Jämför mot upplåst sessionslösenord. */
export function verifyUnlockedPassword(password) {
  if (!isUnlocked()) return false;
  return readSessionPass() === String(password || "");
}

/**
 * Radera lokal databas och setup-flagga (glömt lösenord → börja om).
 */
export async function wipeLocalDatabase() {
  await lockDatabase();
  try {
    if (isWeb()) {
      await Preferences.remove({ key: WEB_VAULT_KEY });
      await Preferences.remove({ key: WEB_SALT_KEY });
    } else {
      await ensureWebStore();
      const exists = await sqlite.isDatabase(DB_NAME);
      if (exists.result) {
        await sqlite.deleteDatabase(DB_NAME);
      }
    }
  } catch (_) {
    /* ignore */
  }
  await clearSetupFlag();
}
