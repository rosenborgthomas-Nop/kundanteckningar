/**
 * Utskrift / hårdkopia av kunduppgifter (t.ex. svar på kundkrav).
 */
import {
  HEALTH_QUESTIONS,
  formatAnswerLabel,
  normalizeHealthDeclaration,
} from "./health-declaration.js";

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateSv(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function formatPrintedAt(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return y + "-" + m + "-" + day + " kl " + h + ":" + min;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(function (entry) {
    let text = entry.text || "";
    if (Array.isArray(entry.additions) && entry.additions.length) {
      const sorted = [...entry.additions].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      for (const addition of sorted) {
        text +=
          "\n\n" +
          formatDateSv(addition.createdAt) +
          "\n" +
          (addition.text || "");
      }
    }
    return {
      createdAt: entry.createdAt,
      text,
    };
  });
}

function contactRows(contact) {
  const c = contact || {};
  const rows = [
    ["Namn", c.namn],
    ["Födelsedata", c.fodelsedata],
    ["Adress", c.adress],
    ["Mobiltelefon", c.mobil],
    ["Yrke", c.yrke],
    ["E-post", c.epost],
  ];
  return rows
    .map(function ([label, value]) {
      const v = String(value || "").trim() || "—";
      return (
        "<tr><th>" +
        escapeHtml(label) +
        "</th><td>" +
        escapeHtml(v) +
        "</td></tr>"
      );
    })
    .join("");
}

function healthSection(declaration) {
  const hd = normalizeHealthDeclaration(declaration);
  if (!hd) {
    return "<p class=\"muted\">Ingen hälsodeklaration sparad.</p>";
  }
  const meta =
    "<p class=\"muted\">Senast ifylld: " +
    escapeHtml(formatDateSv(hd.updatedAt)) +
    "</p>";
  const rows = HEALTH_QUESTIONS.map(function (question, index) {
    const answerText =
      question.type === "comment"
        ? (hd.comment || "").trim() || "—"
        : formatAnswerLabel(question, hd.answers);
    return (
      "<tr><th>" +
      escapeHtml(index + 1 + ". " + question.label) +
      "</th><td>" +
      escapeHtml(answerText) +
      "</td></tr>"
    );
  }).join("");
  return meta + "<table class=\"data\">" + rows + "</table>";
}

function journalSection(entries) {
  const list = normalizeEntries(entries).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  if (!list.length) {
    return "<p class=\"muted\">Inga journalanteckningar.</p>";
  }
  return list
    .map(function (entry) {
      return (
        "<article class=\"entry\">" +
        "<h3>" +
        escapeHtml(formatDateSv(entry.createdAt)) +
        "</h3>" +
        "<pre>" +
        escapeHtml(entry.text || "") +
        "</pre>" +
        "</article>"
      );
    })
    .join("");
}

/**
 * @param {object} patient
 * @returns {string}
 */
export function buildCustomerPrintHtml(patient) {
  const contact = patient?.contact || {};
  const name = String(contact.namn || "").trim() || "Kund";
  const printedAt = formatPrintedAt();

  return (
    "<!DOCTYPE html><html lang=\"sv\"><head><meta charset=\"UTF-8\" />" +
    "<title>Utdrag — " +
    escapeHtml(name) +
    "</title>" +
    "<style>" +
    "body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:24px;line-height:1.45;font-size:12pt;}" +
    "h1{font-size:18pt;margin:0 0 4px;}" +
    "h2{font-size:13pt;margin:28px 0 10px;border-bottom:1px solid #333;padding-bottom:4px;}" +
    "h3{font-size:11pt;margin:0 0 6px;}" +
    ".meta{color:#444;font-size:10pt;margin:0 0 20px;}" +
    ".muted{color:#555;font-size:10pt;}" +
    "table.data{width:100%;border-collapse:collapse;}" +
    "table.data th,table.data td{text-align:left;vertical-align:top;padding:5px 8px 5px 0;border-bottom:1px solid #ddd;}" +
    "table.data th{width:42%;font-weight:600;}" +
    ".entry{margin:0 0 16px;page-break-inside:avoid;}" +
    ".entry pre{white-space:pre-wrap;font-family:inherit;margin:0;}" +
    ".footer{margin-top:32px;font-size:9pt;color:#555;}" +
    "@media print{body{margin:12mm;}}" +
    "</style></head><body>" +
    "<h1>Utdrag av personuppgifter</h1>" +
    "<p class=\"meta\">Omtanken — KundAnteckningar<br />Utskrivet: " +
    escapeHtml(printedAt) +
    "<br />Kunden: " +
    escapeHtml(name) +
    "</p>" +
    "<h2>Kontaktuppgifter</h2>" +
    "<table class=\"data\">" +
    contactRows(contact) +
    "</table>" +
    "<h2>Hälsodeklaration</h2>" +
    healthSection(patient?.healthDeclaration) +
    "<h2>Journalanteckningar</h2>" +
    journalSection(patient?.entries) +
    "<p class=\"footer\">Detta utdrag är avsett som hårdkopia, t.ex. vid svar på kundkrav. " +
    "Uppgifterna kommer från den lokala krypterade journalen.</p>" +
    "</body></html>"
  );
}

/**
 * Öppnar systemets utskriftsdialog med kundutdraget.
 * @param {object} patient
 */
export function printCustomerRecord(patient) {
  if (!patient) {
    throw new Error("Ingen kund vald.");
  }
  const html = buildCustomerPrintHtml(patient);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Utskrift");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = function () {
    setTimeout(function () {
      iframe.remove();
    }, 1500);
  };

  const runPrint = function () {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      cleanup();
    }
  };

  // document.write triggar inte alltid onload — ge layout en tick.
  setTimeout(runPrint, 50);
}
