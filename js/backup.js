/**
 * Krypterad engångsfil-backup (.ka) som användaren kan flytta själv.
 */
import { Preferences } from "@capacitor/preferences";

export const BACKUP_MAGIC = "KundAnteckningarBackup";
export const BACKUP_FORMAT_VERSION = 1;
export const LAST_BACKUP_KEY = "ka_last_backup_at";

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

async function deriveKey(password, saltB64) {
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

function backupFileName(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `backup-${y}${m}${d}-${h}${min}.ka`;
}

/**
 * Bygg krypterad backup-sträng (JSON).
 * @param {unknown[]} patients
 * @param {string} password — appens lösenord (eller valt backup-lösenord)
 */
export async function buildBackupFileText(patients, password) {
  const pass = String(password || "");
  if (pass.length < 8) {
    throw new Error("Lösenordet måste vara minst 8 tecken.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = bufToB64(salt.buffer);
  const key = await deriveKey(pass, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = {
    exportedAt: new Date().toISOString(),
    patients: Array.isArray(patients) ? patients : [],
  };
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plain
  );
  const file = {
    magic: BACKUP_MAGIC,
    version: BACKUP_FORMAT_VERSION,
    createdAt: payload.exportedAt,
    salt: saltB64,
    iv: bufToB64(iv.buffer),
    data: bufToB64(cipher),
  };
  return {
    text: JSON.stringify(file, null, 0),
    fileName: backupFileName(new Date(payload.exportedAt)),
    createdAt: payload.exportedAt,
  };
}

/**
 * Dekryptera .ka-fil → patientlista.
 */
export async function readBackupFileText(text, password) {
  const pass = String(password || "");
  if (!pass) throw new Error("Ange lösenord för backup-filen.");
  let file;
  try {
    file = JSON.parse(String(text || ""));
  } catch (_) {
    throw new Error("Filen är ingen giltig backup.");
  }
  if (!file || file.magic !== BACKUP_MAGIC) {
    throw new Error("Filen är ingen KundAnteckningar-backup.");
  }
  if (Number(file.version) !== BACKUP_FORMAT_VERSION) {
    throw new Error("Backup-formatet stöds inte (för ny/gammal version).");
  }
  if (!file.salt || !file.iv || !file.data) {
    throw new Error("Backup-filen är ofullständig.");
  }
  let payload;
  try {
    const key = await deriveKey(pass, file.salt);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(file.iv) },
      key,
      b64ToBuf(file.data)
    );
    payload = JSON.parse(new TextDecoder().decode(plain));
  } catch (_) {
    throw new Error("Fel lösenord eller skadad backup-fil.");
  }
  const patients = Array.isArray(payload?.patients) ? payload.patients : [];
  return {
    patients,
    createdAt: file.createdAt || payload.exportedAt || "",
  };
}

export async function getLastBackupAt() {
  const { value } = await Preferences.get({ key: LAST_BACKUP_KEY });
  return value || "";
}

export async function setLastBackupAt(iso) {
  await Preferences.set({
    key: LAST_BACKUP_KEY,
    value: String(iso || new Date().toISOString()),
  });
}

/** Spara/dela filen så användaren kan flytta den. */
export async function saveBackupToUser(text, fileName) {
  const blob = new Blob([text], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { method: "download" };
}

/** Välj lokal .ka-fil (Promise med textinnehåll). */
export function pickBackupFileText() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ka,application/json,text/plain";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) {
        reject(new Error("Ingen fil vald."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
  });
}

export function formatBackupStamp(iso) {
  if (!iso) return "Ingen backup gjord ännu.";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Ingen backup gjord ännu.";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `Senaste backup: ${y}-${m}-${day} kl ${h}:${min}`;
}
