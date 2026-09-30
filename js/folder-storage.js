/**
 * Mappbaserad lagring av originaldata (File System Access API).
 * Chrome/Edge på dator: showDirectoryPicker.
 * Telefon: oftast ej stödd — behåll webbläsarvalv.
 */
import { Preferences } from "@capacitor/preferences";
import {
  buildBackupFileText,
  readBackupFileText,
} from "./backup.js";

export const STORAGE_MODE_KEY = "ka_storage_mode";
export const MODE_BROWSER = "browser";
export const MODE_FOLDER = "folder";
export const FOLDER_FILE_NAME = "kundanteckningar.ka";

const IDB_NAME = "ka_fs_handles";
const IDB_STORE = "handles";
const IDB_DIR_KEY = "directory";

export function isFolderPickerSupported() {
  return typeof window.showDirectoryPicker === "function";
}

export async function getStorageMode() {
  const { value } = await Preferences.get({ key: STORAGE_MODE_KEY });
  return value === MODE_FOLDER ? MODE_FOLDER : MODE_BROWSER;
}

export async function setStorageMode(mode) {
  if (mode === MODE_FOLDER) {
    await Preferences.set({ key: STORAGE_MODE_KEY, value: MODE_FOLDER });
  } else {
    await Preferences.remove({ key: STORAGE_MODE_KEY });
  }
}

function openHandlesDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error || new Error("IndexedDB-fel."));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveDirectoryHandle(handle) {
  const db = await openHandlesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, IDB_DIR_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Kunde inte spara mappvalet."));
    };
  });
}

export async function loadDirectoryHandle() {
  try {
    const db = await openHandlesDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_DIR_KEY);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error || new Error("Kunde inte läsa mappvalet."));
      };
    });
  } catch (_) {
    return null;
  }
}

export async function clearDirectoryHandle() {
  try {
    const db = await openHandlesDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(IDB_DIR_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (_) {
    /* ignore */
  }
}

/**
 * @param {FileSystemDirectoryHandle} handle
 * @param {"read"|"readwrite"} mode
 */
export async function ensureDirectoryPermission(handle, mode = "readwrite") {
  if (!handle) return false;
  const opts = { mode };
  try {
    if ((await handle.queryPermission(opts)) === "granted") return true;
    if ((await handle.requestPermission(opts)) === "granted") return true;
  } catch (_) {
    return false;
  }
  return false;
}

export async function pickDirectory() {
  if (!isFolderPickerSupported()) {
    throw new Error(
      "Din webbläsare kan inte välja mapp. Använd Chrome eller Edge på dator."
    );
  }
  return window.showDirectoryPicker({ mode: "readwrite" });
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 */
export async function folderFileExists(dirHandle) {
  try {
    await dirHandle.getFileHandle(FOLDER_FILE_NAME);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 */
export async function readFolderFileText(dirHandle) {
  const fileHandle = await dirHandle.getFileHandle(FOLDER_FILE_NAME);
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} text
 */
export async function writeFolderFileText(dirHandle, text) {
  const fileHandle = await dirHandle.getFileHandle(FOLDER_FILE_NAME, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

/**
 * Skriv patientlista som krypterad kundanteckningar.ka i mappen.
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {unknown[]} patients
 * @param {string} password
 */
export async function writePatientsToFolder(dirHandle, patients, password) {
  const { text } = await buildBackupFileText(patients, password);
  await writeFolderFileText(dirHandle, text);
  return text;
}

/**
 * Läs och dekryptera mappfilen.
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} password
 */
export async function readPatientsFromFolder(dirHandle, password) {
  const text = await readFolderFileText(dirHandle);
  return readBackupFileText(text, password);
}

/**
 * Försök läsa original från vald mapp (om läge = folder).
 * @returns {Promise<
 *   | { ok: true, patients: unknown[] }
 *   | { ok: false, reason: "not-folder"|"no-handle"|"permission"|"no-file"|"bad-password"|"error", error?: Error }
 * >}
 */
export async function tryLoadPatientsFromFolder(password) {
  const mode = await getStorageMode();
  if (mode !== MODE_FOLDER) return { ok: false, reason: "not-folder" };
  const handle = await loadDirectoryHandle();
  if (!handle) return { ok: false, reason: "no-handle" };
  const ok = await ensureDirectoryPermission(handle, "readwrite");
  if (!ok) return { ok: false, reason: "permission" };
  const exists = await folderFileExists(handle);
  if (!exists) return { ok: false, reason: "no-file" };
  try {
    const { patients } = await readPatientsFromFolder(handle, password);
    return { ok: true, patients };
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (/lösenord|password/i.test(msg)) {
      return { ok: false, reason: "bad-password", error: e };
    }
    return { ok: false, reason: "error", error: e };
  }
}

/**
 * Synka aktuell patientlista till mappfilen (om läge = folder).
 */
export async function syncPatientsToFolderIfNeeded(patients, password) {
  const mode = await getStorageMode();
  if (mode !== MODE_FOLDER) return { synced: false };
  const handle = await loadDirectoryHandle();
  if (!handle) return { synced: false, reason: "no-handle" };
  const ok = await ensureDirectoryPermission(handle, "readwrite");
  if (!ok) return { synced: false, reason: "permission" };
  await writePatientsToFolder(handle, patients, password);
  return { synced: true };
}

export async function clearFolderStorageSettings() {
  await setStorageMode(MODE_BROWSER);
  await clearDirectoryHandle();
}

export function formatStorageStatus(mode, supported) {
  if (mode === MODE_FOLDER) {
    return "Originalet sparas i en mapp du valt (filen kundanteckningar.ka).";
  }
  if (!supported) {
    return "Originalet sparas i webbläsaren på den här enheten. Mapphanterare finns inte här (vanligt på telefon) — använd Chrome på dator om du vill spara i en mapp.";
  }
  return "Originalet sparas i webbläsaren på den här enheten.";
}
