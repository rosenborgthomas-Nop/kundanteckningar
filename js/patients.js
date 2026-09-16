import { normalizeHealthDeclaration } from "./health-declaration.js";
import { getDb } from "./db.js";

function normalizePatient(data, id) {
  const raw = data.contact || {};
  const rawMobil = raw.mobil || raw.telHem || raw.telArb || "";
  const digits = String(rawMobil).replace(/\D/g, "");
  let mobil = rawMobil;
  // Spegla samma format som i UI om möjligt → +46 0712 23 45 56
  let d = digits;
  if (d.startsWith("46") && d.length >= 11) {
    const rest = d.slice(2);
    d = rest.startsWith("0") ? rest : "0" + rest;
  }
  if (d.length === 9 && d.startsWith("7")) d = "0" + d;
  if (d.length === 10 && d.startsWith("07")) {
    mobil =
      "+46 " +
      d.slice(0, 4) +
      " " +
      d.slice(4, 6) +
      " " +
      d.slice(6, 8) +
      " " +
      d.slice(8, 10);
  }

  const rawPnr = String(raw.personnummer || "").trim();
  let personnummer = rawPnr;
  const pnrDigits = rawPnr.replace(/\D/g, "");
  if (pnrDigits.length === 10 || pnrDigits.length === 12) {
    // Lätt formatering om datumdelen ser rimlig ut; full kontrollsiffra i UI
    let year;
    let month;
    let day;
    let serial;
    if (pnrDigits.length === 12) {
      year = pnrDigits.slice(0, 4);
      month = pnrDigits.slice(4, 6);
      day = pnrDigits.slice(6, 8);
      serial = pnrDigits.slice(8, 12);
    } else {
      const yy = Number(pnrDigits.slice(0, 2));
      const currentYear = new Date().getFullYear();
      const y2000 = 2000 + yy;
      const y1900 = 1900 + yy;
      const age2000 = currentYear - y2000;
      year = String(
        age2000 >= 0 && age2000 <= 110 ? y2000 : y1900
      ).padStart(4, "0");
      month = pnrDigits.slice(2, 4);
      day = pnrDigits.slice(4, 6);
      serial = pnrDigits.slice(6, 10);
    }
    personnummer = year + month + day + "-" + serial;
  }

  return {
    id: id || data.id,
    contact: {
      namn: raw.namn || "",
      fodelsedata: raw.fodelsedata || "",
      adress: raw.adress || "",
      mobil,
      yrke: raw.yrke || "",
      epost: raw.epost || "",
      personnummer,
    },
    entries: Array.isArray(data.entries) ? data.entries : [],
    healthDeclaration: normalizeHealthDeclaration(data.healthDeclaration),
  };
}

function rowToPatient(row) {
  let contact = {};
  let entries = [];
  let healthDeclaration = null;
  try {
    contact = JSON.parse(row.contact_json || "{}");
  } catch (_) {
    contact = {};
  }
  try {
    entries = JSON.parse(row.entries_json || "[]");
  } catch (_) {
    entries = [];
  }
  try {
    healthDeclaration = row.health_json
      ? JSON.parse(row.health_json)
      : null;
  } catch (_) {
    healthDeclaration = null;
  }
  return normalizePatient(
    { contact, entries, healthDeclaration },
    row.id
  );
}

export async function loadAllPatients() {
  const db = getDb();
  const result = await db.query("SELECT * FROM patients ORDER BY id ASC;");
  const values = result.values || [];
  return values.map(rowToPatient);
}

export async function savePatient(patient) {
  const db = getDb();
  const normalized = normalizePatient(patient, patient.id);
  const healthDeclaration = normalizeHealthDeclaration(
    normalized.healthDeclaration
  );
  const updatedAt = new Date().toISOString();
  await db.run(
    `INSERT OR REPLACE INTO patients
      (id, contact_json, entries_json, health_json, updated_at)
     VALUES (?, ?, ?, ?, ?);`,
    [
      normalized.id,
      JSON.stringify(normalized.contact),
      JSON.stringify(normalized.entries),
      healthDeclaration ? JSON.stringify(healthDeclaration) : null,
      updatedAt,
    ]
  );
  return {
    ...normalized,
    healthDeclaration,
  };
}

export async function deletePatient(patientId) {
  const db = getDb();
  await db.run("DELETE FROM patients WHERE id = ?;", [patientId]);
}

/** Ersätt hela kundregistret (vid återställning från backup). */
export async function replaceAllPatients(patients) {
  const db = getDb();
  const existing = await loadAllPatients();
  for (const p of existing) {
    await db.run("DELETE FROM patients WHERE id = ?;", [p.id]);
  }
  const list = Array.isArray(patients) ? patients : [];
  const saved = [];
  for (const raw of list) {
    const id = raw.id || makeId();
    saved.push(await savePatient({ ...raw, id }));
  }
  return saved;
}

export function makeId() {
  return (
    "p_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}
