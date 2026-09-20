import { formatAppVersion } from "./app-version.js";
import { authErrorMessage, logOut, requireJournalAccess } from "./auth.js";
import { registerServiceWorker } from "./register-sw.js";

registerServiceWorker();
import {
  formatAnswerLabel,
  HEALTH_QUESTIONS,
  emptyHealthAnswers,
  normalizeHealthDeclaration,
} from "./health-declaration.js";
import {
  deletePatient,
  loadAllPatients,
  makeId,
  savePatient,
} from "./patients.js";

const NEW_CUSTOMER = "__ny__";

const customerSelect = document.getElementById("customer-select");
const kundregisterListView = document.getElementById("kundregister-list-view");
const kundregisterList = document.getElementById("kundregister-list");
const kundregisterListEmpty = document.getElementById("kundregister-list-empty");
const newCustomerBtn = document.getElementById("new-customer-btn");
const kundregisterView = document.getElementById("kundregister-view");
const journalView = document.getElementById("journal-view");
const journalList = document.getElementById("journal-list");
const journalEmpty = document.getElementById("journal-empty");
const journalCustomerName = document.getElementById("journal-customer-name");
const newEntryBtn = document.getElementById("new-entry-btn");
const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const modalDate = document.getElementById("modal-date");
const modalText = document.getElementById("modal-text");
const modalCancel = document.getElementById("modal-cancel");
const modalSave = document.getElementById("modal-save");
const modalDelete = document.getElementById("modal-delete");
const loadNotice = document.getElementById("load-notice");
const logoutLink = document.getElementById("logout-link");
const settingsLink = document.getElementById("settings-link");
const saveContactBtn = document.getElementById("save-contact-btn");
const cancelContactBtn = document.getElementById("cancel-contact-btn");
const deleteCustomerZone = document.getElementById("delete-customer-zone");
const deleteCustomerBtn = document.getElementById("delete-customer-btn");
const deleteModalBackdrop = document.getElementById("delete-modal-backdrop");
const deleteCustomerName = document.getElementById("delete-customer-name");
const deleteModalCancel = document.getElementById("delete-modal-cancel");
const deleteModalConfirm = document.getElementById("delete-modal-confirm");
const deleteEntryModalBackdrop = document.getElementById("delete-entry-modal-backdrop");
const deleteEntryModalCancel = document.getElementById("delete-entry-modal-cancel");
const deleteEntryModalConfirm = document.getElementById("delete-entry-modal-confirm");
const unsavedModalBackdrop = document.getElementById("unsaved-modal-backdrop");
const unsavedModalCancel = document.getElementById("unsaved-modal-cancel");
const unsavedModalConfirm = document.getElementById("unsaved-modal-confirm");
const phoneDupModalBackdrop = document.getElementById("phone-dup-modal-backdrop");
const phoneDupModalText = document.getElementById("phone-dup-modal-text");
const phoneDupModalCancel = document.getElementById("phone-dup-modal-cancel");
const phoneDupModalConfirm = document.getElementById("phone-dup-modal-confirm");
const hdConfirmModalBackdrop = document.getElementById("hd-confirm-modal-backdrop");
const hdConfirmModalTitle = document.getElementById("hd-confirm-modal-title");
const hdConfirmModalBody = document.getElementById("hd-confirm-modal-body");
const hdConfirmModalCancel = document.getElementById("hd-confirm-modal-cancel");
const hdConfirmModalConfirm = document.getElementById("hd-confirm-modal-confirm");
const hdToolbar = document.getElementById("hd-toolbar");
const hdBtn = document.getElementById("hd-btn");
const openKundregisterBtn = document.getElementById("open-kundregister-btn");
const openContactBtn = document.getElementById("open-contact-btn");
const openNotesBtn = document.getElementById("open-notes-btn");
const hdModalBackdrop = document.getElementById("hd-modal-backdrop");
const hdModalTitle = document.getElementById("hd-modal-title");
const hdModalSub = document.getElementById("hd-modal-sub");
const hdModalBody = document.getElementById("hd-modal-body");
const hdModalCancel = document.getElementById("hd-modal-cancel");
const hdModalSave = document.getElementById("hd-modal-save");
const hdModalClose = document.getElementById("hd-modal-close");
const hdModalReplace = document.getElementById("hd-modal-replace");
const menuToggle = document.getElementById("menu-toggle");
const appMenu = document.getElementById("app-menu");
const appViewTitle = document.getElementById("app-view-title");

const contactFields = [
  "field-namn",
  "field-fodelsedata",
  "field-adress",
  "field-mobil",
  "field-yrke",
  "field-epost",
];

let patients = [];
let selectedId = "";
let modalMode = "entry";
let modalEntryId = "";
let saving = false;
let deleting = false;
let savedContactSnapshot = "";
let lastCustomerSelectValue = "";
let lastView = "kundregister";
let currentView = "kundregister";
/** "list" | "form" within kundregister view */
let kundregisterScreen = "list";
let unsavedConfirmResolve = null;
let phoneDupConfirmResolve = null;
let hdConfirmResolve = null;

function normalizeContact(contact) {
  const rawMobil =
    (contact.mobil || "").trim() ||
    (contact.telHem || "").trim() ||
    (contact.telArb || "").trim();
  const formatted = formatSwedishMobile(rawMobil);
  const rawPnr = (contact.personnummer || "").trim();
  const formattedPnr = formatPersonnummer(rawPnr);
  return {
    namn: (contact.namn || "").trim(),
    fodelsedata: (contact.fodelsedata || "").trim(),
    adress: (contact.adress || "").trim(),
    mobil: formatted || rawMobil,
    yrke: (contact.yrke || "").trim(),
    epost: (contact.epost || "").trim(),
    personnummer: formattedPnr || rawPnr,
  };
}

function snapshotContact(contact) {
  return JSON.stringify(normalizeContact(contact));
}

function isKundregisterVisible() {
  return getActiveView() === "kundregister" && !kundregisterView.hidden;
}

function isContactFormDirty() {
  if (!isKundregisterVisible() || !getSelectedPatient()) return false;
  return snapshotContact(readContactForm()) !== savedContactSnapshot;
}

function markContactFormSaved(contact) {
  const source = contact || readContactForm();
  savedContactSnapshot = snapshotContact(source);
}

function discardContactFormEdits() {
  const patient = getSelectedPatient();
  if (!patient) {
    savedContactSnapshot = "";
    return;
  }
  writeContactForm(patient.contact);
}

function isUnsavedModalOpen() {
  return !unsavedModalBackdrop.hidden;
}

function isPhoneDupModalOpen() {
  return phoneDupModalBackdrop && !phoneDupModalBackdrop.hidden;
}

function confirmDiscardUnsavedChanges() {
  if (!isContactFormDirty()) return Promise.resolve(true);
  return new Promise((resolve) => {
    unsavedConfirmResolve = resolve;
    unsavedModalBackdrop.hidden = false;
  });
}

function closeUnsavedModal(confirmed) {
  unsavedModalBackdrop.hidden = true;
  if (unsavedConfirmResolve) {
    unsavedConfirmResolve(confirmed);
    unsavedConfirmResolve = null;
  }
}

function confirmDuplicatePhone(ownerName) {
  return new Promise((resolve) => {
    phoneDupConfirmResolve = resolve;
    if (phoneDupModalText) {
      phoneDupModalText.innerHTML =
        "Telefonnumret finns redan registrerat för <strong>" +
        escapeHtml(ownerName) +
        "</strong>.";
    }
    phoneDupModalBackdrop.hidden = false;
  });
}

function closePhoneDupModal(confirmed) {
  if (phoneDupModalBackdrop) phoneDupModalBackdrop.hidden = true;
  if (phoneDupConfirmResolve) {
    phoneDupConfirmResolve(confirmed);
    phoneDupConfirmResolve = null;
  }
}

function confirmHealthDialog(options) {
  return new Promise((resolve) => {
    hdConfirmResolve = resolve;
    if (hdConfirmModalTitle) {
      hdConfirmModalTitle.textContent = options.title || "Bekräfta";
    }
    if (hdConfirmModalBody) {
      hdConfirmModalBody.innerHTML = options.bodyHtml || "";
    }
    if (hdConfirmModalConfirm) {
      hdConfirmModalConfirm.textContent = options.confirmLabel || "OK";
    }
    if (hdConfirmModalBackdrop) hdConfirmModalBackdrop.hidden = false;
  });
}

function closeHealthConfirmModal(confirmed) {
  if (hdConfirmModalBackdrop) hdConfirmModalBackdrop.hidden = true;
  if (hdConfirmResolve) {
    hdConfirmResolve(confirmed);
    hdConfirmResolve = null;
  }
}

function showLoadNotice(text, isError) {
  if (!text) {
    loadNotice.hidden = true;
    loadNotice.textContent = "";
    loadNotice.classList.remove("is-visible", "is-error");
    return;
  }
  loadNotice.hidden = false;
  loadNotice.classList.add("is-visible");
  loadNotice.classList.toggle("is-error", Boolean(isError));
  loadNotice.textContent = text;
}

function contactFormCanSave() {
  const contact = readContactForm();
  const namn = contact.namn.trim();
  const phoneOk = isValidSwedishMobile(contact.mobil);
  const nameDup = findDuplicateName(namn, selectedId);
  return Boolean(namn && phoneOk && !nameDup && isContactFormDirty());
}

function updateSaveButtonState() {
  saveContactBtn.disabled = !contactFormCanSave();
  updateNamnHint();
  updateMobilHint();
  updateFieldInvalidStyles();
}

/** Endast siffror; +46 7… / +46 07… → 07… */
function phoneDigits(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  // +46 712… → 0712…  |  +46 0712… (vårt visningsformat) → 0712…
  if (digits.startsWith("46") && digits.length >= 11) {
    const rest = digits.slice(2);
    digits = rest.startsWith("0") ? rest : "0" + rest;
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    digits = "0" + digits;
  }
  return digits;
}

/**
 * Format: +46 0712 23 45 56
 * Landsnummer +46 läggs till om det saknas. 10 siffror som börjar med 07.
 */
function formatSwedishMobile(raw) {
  const digits = phoneDigits(raw);
  if (digits.length !== 10 || !digits.startsWith("07")) return "";
  return (
    "+46 " +
    digits.slice(0, 4) +
    " " +
    digits.slice(4, 6) +
    " " +
    digits.slice(6, 8) +
    " " +
    digits.slice(8, 10)
  );
}

function isValidSwedishMobile(raw) {
  return Boolean(formatSwedishMobile(raw));
}

function mobilFormatHintMessage(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const digits = phoneDigits(trimmed);
  if (digits.length < 10) {
    return "Numret verkar sakna siffror (svenskt mobilnummer har 10 siffror, t.ex. +46 0712 23 45 56).";
  }
  if (digits.length > 10) {
    return "Numret har för många siffror.";
  }
  if (!digits.startsWith("07")) {
    return "Svenskt mobilnummer ska börja med 07.";
  }
  return "";
}

function findDuplicatePhone(mobil, excludeId) {
  const digits = phoneDigits(mobil);
  if (digits.length !== 10 || !digits.startsWith("07")) return null;
  return (
    patients.find(
      (p) =>
        p.id !== excludeId &&
        phoneDigits(p.contact.mobil || "") === digits
    ) || null
  );
}

function mobilHintMessage(raw) {
  const formatMsg = mobilFormatHintMessage(raw);
  if (formatMsg) return formatMsg;
  const trimmed = String(raw || "").trim();
  if (!trimmed || !isValidSwedishMobile(trimmed)) return "";
  const dup = findDuplicatePhone(trimmed, selectedId);
  if (dup) {
    return (
      "Telefonnumret finns redan registrerat för " + customerLabel(dup) + "."
    );
  }
  return "";
}

function namnHintMessage(raw) {
  const namn = String(raw || "").trim();
  if (!namn) return "";
  if (findDuplicateName(namn, selectedId)) {
    return "Det finns redan en kund med det namnet.";
  }
  return "";
}

function updateNamnHint() {
  const hint = document.getElementById("namn-hint");
  const input = document.getElementById("field-namn");
  if (!hint || !input) return;
  const message = namnHintMessage(input.value);
  if (!message) {
    hint.hidden = true;
    hint.textContent = "";
    return;
  }
  hint.hidden = false;
  hint.textContent = message;
}

function updateMobilHint() {
  const hint = document.getElementById("mobil-hint");
  const input = document.getElementById("field-mobil");
  if (!hint || !input) return;
  const message = mobilHintMessage(input.value);
  if (!message) {
    hint.hidden = true;
    hint.textContent = "";
    hint.classList.remove("kundregister-hint--notice");
    return;
  }
  hint.hidden = false;
  hint.textContent = message;
  // Dubblett = varning (inte formatfel)
  hint.classList.toggle(
    "kundregister-hint--notice",
    Boolean(!mobilFormatHintMessage(input.value) && message)
  );
}

function setFieldInvalid(input, invalid) {
  if (!input) return;
  input.classList.toggle("field-input--invalid", Boolean(invalid));
}

function updateFieldInvalidStyles() {
  const namn = document.getElementById("field-namn");
  const mobil = document.getElementById("field-mobil");
  setFieldInvalid(namn, Boolean(namnHintMessage(namn && namn.value)));
  setFieldInvalid(mobil, Boolean(mobilFormatHintMessage(mobil && mobil.value)));
}

/**
 * Svenskt personnummer: kontrollsiffra (Luhn) på de 10 sista siffrorna.
 * Samordningsnummer: dag 61–91 räknas som dag − 60.
 */
function personnummerDigits(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function swedishPersonnummerChecksumOk(tenDigits) {
  if (!/^\d{10}$/.test(tenDigits)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(tenDigits[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

function isValidPersonnummerDate(year, month, dayOrCoord) {
  let day = dayOrCoord;
  if (day >= 61 && day <= 91) day -= 60;
  return isValidCalendarDate(year, month, day);
}

/**
 * Om siffrorna kan vara ett giltigt personnummer → ååååmmdd-xxxx, annars "".
 * Accepterar 10 (ååmmddxxxx) eller 12 (ååååmmddxxxx) siffror, med/utan bindestreck.
 */
function formatPersonnummer(raw) {
  const digits = personnummerDigits(raw);
  let year;
  let month;
  let day;
  let serial;
  let ten;

  if (digits.length === 12) {
    year = Number(digits.slice(0, 4));
    month = Number(digits.slice(4, 6));
    day = Number(digits.slice(6, 8));
    serial = digits.slice(8, 12);
    ten = digits.slice(2);
  } else if (digits.length === 10) {
    year = expandTwoDigitYear(Number(digits.slice(0, 2)));
    month = Number(digits.slice(2, 4));
    day = Number(digits.slice(4, 6));
    serial = digits.slice(6, 10);
    ten = digits;
  } else {
    return "";
  }

  if (!isValidPersonnummerDate(year, month, day)) return "";
  if (!swedishPersonnummerChecksumOk(ten)) return "";

  return (
    String(year).padStart(4, "0") +
    String(month).padStart(2, "0") +
    String(day).padStart(2, "0") +
    "-" +
    serial
  );
}

function isValidPersonnummer(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return true; // valfritt
  return Boolean(formatPersonnummer(trimmed));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

/** Expand åå to åååå — prefer ages 0–110 (inga 125-åringar). */
function expandTwoDigitYear(yy) {
  const currentYear = new Date().getFullYear();
  const y2000 = 2000 + yy;
  const y1900 = 1900 + yy;
  const age2000 = currentYear - y2000;
  const age1900 = currentYear - y1900;
  const ok2000 = age2000 >= 0 && age2000 <= 110;
  const ok1900 = age1900 >= 0 && age1900 <= 110;
  if (ok2000 && ok1900) return y2000;
  if (ok2000) return y2000;
  if (ok1900) return y1900;
  if (age2000 >= 0) return y2000;
  return y1900;
}

function isValidCalendarDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/** Format födelsedata till ÅÅÅÅ-MM-DD from e.g. ååmmdd, ååååmmdd, mixed separators. */
function formatBirthDateInput(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  let year;
  let month;
  let day;

  if (digits.length === 6) {
    year = expandTwoDigitYear(Number(digits.slice(0, 2)));
    month = Number(digits.slice(2, 4));
    day = Number(digits.slice(4, 6));
  } else if (digits.length === 8) {
    year = Number(digits.slice(0, 4));
    month = Number(digits.slice(4, 6));
    day = Number(digits.slice(6, 8));
  } else {
    return trimmed;
  }

  if (!isValidCalendarDate(year, month, day)) return trimmed;

  return (
    String(year).padStart(4, "0") +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0")
  );
}

function nowIso() {
  return new Date().toISOString();
}

function todayDateInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function dateInputToIso(dateValue) {
  const parts = dateValue.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return nowIso();
  }
  const [year, month, day] = parts;
  const local = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(local.getTime())) return nowIso();
  return local.toISOString();
}

function isoToDateInputValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return todayDateInputValue();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

/** Flatten old tillägg into plain text entries (migration). */
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
          formatDate(addition.createdAt) +
          "\n" +
          (addition.text || "");
      }
    }
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      text: text,
    };
  });
}

function emptyContact() {
  return {
    namn: "",
    fodelsedata: "",
    adress: "",
    mobil: "",
    yrke: "",
    epost: "",
    personnummer: "",
  };
}

function getSelectedPatient() {
  return patients.find((p) => p.id === selectedId) || null;
}

function customerLabel(patient) {
  const name = (patient.contact.namn || "").trim();
  return name || "Namnlös kund";
}

function sortPatients(list) {
  return [...list].sort((a, b) =>
    customerLabel(a).localeCompare(customerLabel(b), "sv", {
      sensitivity: "base",
      numeric: true,
    })
  );
}

function selectFirstCustomer() {
  currentView = "kundregister";
  lastView = "kundregister";
  kundregisterScreen = "list";
  updateMenuActiveState();
  const sorted = sortPatients(patients).filter((p) =>
    (p.contact.namn || "").trim()
  );
  if (!sorted.length) {
    selectedId = "";
    fillCustomerSelect();
    syncVisibility();
    return;
  }

  selectedId = sorted[0].id;
  fillCustomerSelect(sorted[0].id);
  syncVisibility();
}

function findDuplicateName(namn, excludeId) {
  const wanted = namn.trim().toLowerCase();
  if (!wanted) return null;
  return (
    patients.find(
      (p) =>
        p.id !== excludeId &&
        (p.contact.namn || "").trim().toLowerCase() === wanted
    ) || null
  );
}

function fillCustomerSelect(keepSelectedId) {
  const previous = keepSelectedId || customerSelect.value;
  customerSelect.innerHTML = "";

  const sorted = [...patients]
    .filter((p) => (p.contact.namn || "").trim() || p.id === previous)
    .sort((a, b) =>
      customerLabel(a).localeCompare(customerLabel(b), "sv", {
        sensitivity: "base",
        numeric: true,
      })
    );

  for (const patient of sorted) {
    const opt = document.createElement("option");
    opt.value = patient.id;
    opt.textContent = customerLabel(patient);
    customerSelect.appendChild(opt);
  }

  const newOpt = document.createElement("option");
  newOpt.value = NEW_CUSTOMER;
  newOpt.textContent = "+ Ny kund";
  customerSelect.appendChild(newOpt);

  if (previous && previous !== NEW_CUSTOMER && patients.some((p) => p.id === previous)) {
    customerSelect.value = previous;
  } else if (sorted.length) {
    customerSelect.value = sorted[0].id;
  } else {
    customerSelect.value = NEW_CUSTOMER;
  }

  selectedId =
    customerSelect.value && customerSelect.value !== NEW_CUSTOMER
      ? customerSelect.value
      : "";

  updateCustomerCount();
}

function updateCustomerCount() {
  const labelEl = document.getElementById("customer-count-label");
  if (!labelEl) return;
  const count = patients.filter((p) => (p.contact.namn || "").trim()).length;
  labelEl.textContent = "Poster:[" + count + "]";
}

function getActiveView() {
  return currentView === "journal" ? "journal" : "kundregister";
}

function updateMenuActiveState() {
  /* Menyn har bara Inställningar / Logga ut — ingen aktiv vy-knapp */
}

function closeAppMenu() {
  if (!appMenu || !menuToggle) return;
  appMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Öppna meny");
}

function toggleAppMenu() {
  if (!appMenu || !menuToggle) return;
  const open = appMenu.hidden;
  appMenu.hidden = !open;
  menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  menuToggle.setAttribute("aria-label", open ? "Stäng meny" : "Öppna meny");
}

async function setActiveView(newView) {
  const next = newView === "journal" ? "journal" : "kundregister";
  if (lastView === "kundregister" && kundregisterScreen === "form" && next !== "kundregister") {
    if (!(await confirmDiscardUnsavedChanges())) {
      updateMenuActiveState();
      return false;
    }
    discardContactFormEdits();
  }
  if (lastView === "kundregister" && kundregisterScreen === "form" && next === "kundregister") {
    // Meny Kundregister medan formulär är öppet → tillbaka till listan
    if (isContactFormDirty()) {
      if (!(await confirmDiscardUnsavedChanges())) {
        updateMenuActiveState();
        return false;
      }
      discardContactFormEdits();
    }
  }
  currentView = next;
  lastView = next;
  if (next === "kundregister") {
    kundregisterScreen = "list";
    // Rensa osparade utkast när vi visar listan
    if (selectedId) {
      removeUnsavedDraft(selectedId);
      if (!getSelectedPatient()) {
        selectedId = "";
        fillCustomerSelect();
      }
    }
  } else {
    // Anteckningar: lämna inte formulärstatus kvar (annars blockeras Kontaktuppgifter)
    kundregisterScreen = "list";
  }
  updateMenuActiveState();
  syncVisibility();
  return true;
}

function isSavedCustomer(patient) {
  return Boolean(patient && (patient.contact.namn || "").trim());
}

function blockKeyboardOnButton(button) {
  button.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
}

function isDeleteModalOpen() {
  return !deleteModalBackdrop.hidden;
}

function isDeleteEntryModalOpen() {
  return !deleteEntryModalBackdrop.hidden;
}

function isEntryModalOpen() {
  return !modalBackdrop.hidden;
}

function syncVisibility() {
  const patient = getSelectedPatient();
  const view = getActiveView();
  const hasCustomer = Boolean(patient);
  const showList = view === "kundregister" && kundregisterScreen === "list";
  const showForm = view === "kundregister" && kundregisterScreen === "form";
  const showNotes = view === "journal";

  updateAppViewTitle(showList, showForm, showNotes);

  const countLabel = document.getElementById("customer-count-label");
  if (countLabel) countLabel.hidden = !showList;

  const wrapEl = document.querySelector(".wrap--journal");
  if (wrapEl) {
    wrapEl.classList.toggle("wrap--anteckningar-wide", showNotes);
  }

  if (kundregisterListView) kundregisterListView.hidden = !showList;
  kundregisterView.hidden = !showForm;
  journalView.hidden = !showNotes;
  deleteCustomerZone.hidden = !showForm || !isSavedCustomer(patient);
  const showContextNav = isSavedCustomer(patient) && (showForm || showNotes);
  hdToolbar.hidden = !showContextNav;
  updateContextNavButtons(showForm, showNotes);

  if (showList) {
    updateCustomerCount();
    renderCustomerList();
  }

  if (showNotes) {
    if (hasCustomer && isSavedCustomer(patient)) {
      if (journalCustomerName) {
        journalCustomerName.textContent = customerLabel(patient);
        journalCustomerName.hidden = false;
      }
      renderJournal();
    } else {
      if (journalCustomerName) {
        journalCustomerName.textContent = "";
        journalCustomerName.hidden = true;
      }
      journalList.innerHTML = "";
      journalEmpty.hidden = false;
      journalEmpty.textContent =
        "Välj en kund via kundregistret (dubbelklick eller håll inne) för att se anteckningar.";
    }
  }

  if (showForm && hasCustomer) {
    updateSaveButtonState();
  }
}

function updateAppViewTitle(showList, showForm, showNotes) {
  if (!appViewTitle) return;
  if (showForm) {
    appViewTitle.textContent = "Kontaktuppgifter";
  } else if (showNotes) {
    appViewTitle.textContent = "Anteckningar";
  } else {
    appViewTitle.textContent = "Kundregister";
  }
}

function updateContextNavButtons(showForm, showNotes) {
  if (openNotesBtn) {
    // Anteckningar-knappen bara på Kontaktuppgifter
    openNotesBtn.hidden = !showForm;
  }
  if (openContactBtn) {
    // Kontaktuppgifter-knappen bara på Anteckningar
    openContactBtn.hidden = !showNotes;
  }
  if (openKundregisterBtn) {
    openKundregisterBtn.hidden = false;
  }
}

function readContactForm() {
  const mobilRaw = document.getElementById("field-mobil").value;
  const mobilFormatted = formatSwedishMobile(mobilRaw);
  const existing = getSelectedPatient();
  const existingPnr = existing && existing.contact
    ? String(existing.contact.personnummer || "").trim()
    : "";
  return {
    namn: document.getElementById("field-namn").value,
    fodelsedata: formatBirthDateInput(
      document.getElementById("field-fodelsedata").value
    ),
    adress: document.getElementById("field-adress").value,
    mobil: mobilFormatted || mobilRaw.trim(),
    yrke: document.getElementById("field-yrke").value,
    epost: document.getElementById("field-epost").value,
    // Fältet är borttaget ur UI — behåll ev. gammalt värde orört i databasen
    personnummer: existingPnr,
  };
}

function writeContactForm(contact) {
  const normalized = normalizeContact(contact || {});
  document.getElementById("field-namn").value = normalized.namn || "";
  document.getElementById("field-fodelsedata").value = formatBirthDateInput(
    normalized.fodelsedata || ""
  );
  document.getElementById("field-adress").value = normalized.adress || "";
  document.getElementById("field-mobil").value = normalized.mobil || "";
  document.getElementById("field-yrke").value = normalized.yrke || "";
  document.getElementById("field-epost").value = normalized.epost || "";
  updateSaveButtonState();
  markContactFormSaved(normalized);
}

async function persistPatient(patient) {
  saving = true;
  showLoadNotice("Sparar…");
  try {
    await savePatient(patient);
    showLoadNotice("Sparat.");
    setTimeout(() => showLoadNotice(""), 2000);
  } catch (error) {
    showLoadNotice("Kunde inte spara: " + authErrorMessage(error), true);
  } finally {
    saving = false;
  }
}

function removeUnsavedDraft(patientId) {
  const patient = patients.find((p) => p.id === patientId);
  if (patient && !(patient.contact.namn || "").trim()) {
    patients = patients.filter((p) => p.id !== patientId);
  }
}

async function saveContact(event) {
  if (event) event.preventDefault();

  const patient = getSelectedPatient();
  if (!patient || !contactFormCanSave()) return;

  const contact = readContactForm();
  if (!isValidSwedishMobile(contact.mobil)) {
    showLoadNotice(
      "Kontrollera mobilnumret (10 siffror, börjar med 07).",
      true
    );
    updateMobilHint();
    updateFieldInvalidStyles();
    return;
  }
  contact.mobil = formatSwedishMobile(contact.mobil);
  document.getElementById("field-mobil").value = contact.mobil;

  const namn = contact.namn.trim();

  if (findDuplicateName(namn, patient.id)) {
    showLoadNotice("Det finns redan en kund med det namnet.", true);
    return;
  }

  const phoneDup = findDuplicatePhone(contact.mobil, patient.id);
  if (phoneDup) {
    const ok = await confirmDuplicatePhone(customerLabel(phoneDup));
    if (!ok) return;
  }

  // Behåll personnummer om det redan fanns (fältet finns inte i UI längre)
  contact.personnummer = String(patient.contact.personnummer || "").trim();
  patient.contact = contact;
  await persistPatient(patient);
  fillCustomerSelect(patient.id);
  markContactFormSaved(contact);
  kundregisterScreen = "list";
  updateSaveButtonState();
  syncVisibility();
}

async function cancelContact() {
  const patient = getSelectedPatient();
  if (!patient) {
    kundregisterScreen = "list";
    syncVisibility();
    return;
  }

  if (!(await confirmDiscardUnsavedChanges())) return;

  const wasUnsaved = !(patient.contact.namn || "").trim();

  if (wasUnsaved) {
    removeUnsavedDraft(patient.id);
    selectedId = "";
    fillCustomerSelect();
  } else {
    writeContactForm(patient.contact);
  }

  kundregisterScreen = "list";
  showLoadNotice("");
  syncVisibility();
}

const LONG_PRESS_MS = 550;
const LONG_PRESS_MOVE_PX = 14;
const CLICK_DELAY_MS = 280;

function phoneLabel(patient) {
  return (patient.contact.mobil || "").trim() || "—";
}

function savedPatientsSorted() {
  return sortPatients(patients).filter((p) => (p.contact.namn || "").trim());
}

function renderCustomerList() {
  if (!kundregisterList || !kundregisterListEmpty) return;
  kundregisterList.innerHTML = "";
  const sorted = savedPatientsSorted();

  if (!sorted.length) {
    kundregisterListEmpty.hidden = false;
    return;
  }

  kundregisterListEmpty.hidden = true;

  for (const patient of sorted) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "kundregister-row";
    row.setAttribute("role", "listitem");
    row.dataset.patientId = patient.id;
    if (patient.id === selectedId) {
      row.classList.add("is-selected");
    }

    const nameEl = document.createElement("span");
    nameEl.className = "kundregister-row__name";
    nameEl.textContent = customerLabel(patient);

    const phoneEl = document.createElement("span");
    phoneEl.className = "kundregister-row__phone";
    phoneEl.textContent = phoneLabel(patient);

    row.appendChild(nameEl);
    row.appendChild(phoneEl);
    bindCustomerRowTriggers(row, patient.id);
    kundregisterList.appendChild(row);
  }
}

async function openCustomerForm(patientId) {
  if (
    getActiveView() === "kundregister" &&
    kundregisterScreen === "form" &&
    selectedId === patientId
  ) {
    return;
  }
  if (kundregisterScreen === "form" && isContactFormDirty()) {
    if (!(await confirmDiscardUnsavedChanges())) return;
    discardContactFormEdits();
  }

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return;

  selectedId = patientId;
  fillCustomerSelect(patientId);
  lastCustomerSelectValue = patientId;
  writeContactForm(patient.contact);
  currentView = "kundregister";
  lastView = "kundregister";
  kundregisterScreen = "form";
  updateMenuActiveState();
  syncVisibility();
}

async function openCustomerAnteckningar(patientId) {
  if (kundregisterScreen === "form" && isContactFormDirty()) {
    if (!(await confirmDiscardUnsavedChanges())) return;
    discardContactFormEdits();
  }

  const patient = patients.find((p) => p.id === patientId);
  if (!patient || !isSavedCustomer(patient)) return;

  selectedId = patientId;
  fillCustomerSelect(patientId);
  lastCustomerSelectValue = patientId;
  writeContactForm(patient.contact);
  currentView = "journal";
  lastView = "journal";
  kundregisterScreen = "list";
  updateMenuActiveState();
  syncVisibility();
}

function bindCustomerRowTriggers(element, patientId) {
  let clickTimer = null;
  let longPressTimer = null;
  let longPressFired = false;
  let startX = 0;
  let startY = 0;

  function clearClickTimer() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  element.addEventListener("click", function (event) {
    if (longPressFired) {
      longPressFired = false;
      event.preventDefault();
      return;
    }
    clearClickTimer();
    clickTimer = setTimeout(function () {
      clickTimer = null;
      void openCustomerForm(patientId);
    }, CLICK_DELAY_MS);
  });

  element.addEventListener("dblclick", function (event) {
    event.preventDefault();
    clearClickTimer();
    void openCustomerAnteckningar(patientId);
  });

  element.addEventListener(
    "touchstart",
    function (event) {
      if (event.touches.length !== 1) return;
      longPressFired = false;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      clearLongPress();
      longPressTimer = setTimeout(function () {
        longPressTimer = null;
        longPressFired = true;
        clearClickTimer();
        void openCustomerAnteckningar(patientId);
      }, LONG_PRESS_MS);
    },
    { passive: true }
  );

  element.addEventListener(
    "touchmove",
    function (event) {
      if (!longPressTimer || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (
        Math.hypot(touch.clientX - startX, touch.clientY - startY) >
        LONG_PRESS_MOVE_PX
      ) {
        clearLongPress();
      }
    },
    { passive: true }
  );

  element.addEventListener("touchend", clearLongPress, { passive: true });
  element.addEventListener("touchcancel", clearLongPress, { passive: true });

  element.addEventListener("contextmenu", function (event) {
    if (longPressFired) event.preventDefault();
  });
}

function bindEntryOpenTrigger(element, entryId, textEl, fullText, previewText) {
  let clickTimer = null;
  let longPressTimer = null;
  let longPressFired = false;
  let startX = 0;
  let startY = 0;

  function clearClickTimer() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function toggleExpanded() {
    const block = element.closest(".journal-entry");
    if (!block) return;
    const willExpand = !block.classList.contains("is-expanded");

    journalList.querySelectorAll(".journal-entry.is-expanded").forEach(function (el) {
      if (el === block) return;
      el.classList.remove("is-expanded");
      const otherText = el.querySelector(".journal-entry__text");
      const otherPreview = el.dataset.preview || "";
      if (otherText) otherText.textContent = otherPreview;
      const otherActions = el.querySelector(".journal-entry__actions");
      if (otherActions) otherActions.hidden = true;
    });

    block.classList.toggle("is-expanded", willExpand);
    textEl.textContent = willExpand ? fullText : previewText;
    const actions = block.querySelector(".journal-entry__actions");
    if (actions) actions.hidden = !willExpand;
  }

  element.addEventListener("click", function () {
    if (longPressFired) {
      longPressFired = false;
      return;
    }
    clearClickTimer();
    clickTimer = setTimeout(function () {
      clickTimer = null;
      toggleExpanded();
    }, CLICK_DELAY_MS);
  });

  element.addEventListener("dblclick", function (event) {
    event.preventDefault();
    clearClickTimer();
    openEditModal(entryId);
  });

  element.addEventListener(
    "touchstart",
    function (event) {
      if (event.touches.length !== 1) return;
      longPressFired = false;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      clearLongPress();
      longPressTimer = setTimeout(function () {
        longPressTimer = null;
        longPressFired = true;
        clearClickTimer();
        openEditModal(entryId);
      }, LONG_PRESS_MS);
    },
    { passive: true }
  );

  element.addEventListener(
    "touchmove",
    function (event) {
      if (!longPressTimer || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (
        Math.hypot(touch.clientX - startX, touch.clientY - startY) >
        LONG_PRESS_MOVE_PX
      ) {
        clearLongPress();
      }
    },
    { passive: true }
  );

  element.addEventListener("touchend", clearLongPress, { passive: true });
  element.addEventListener("touchcancel", clearLongPress, { passive: true });
  element.addEventListener("contextmenu", function (event) {
    if (longPressFired) event.preventDefault();
  });
}

function entryPreview(text, maxLen) {
  const limit = maxLen || 72;
  const oneLine = String(text || "").replace(/\s+/g, " ").trim();
  if (!oneLine) return "Tom anteckning";
  if (oneLine.length <= limit) return oneLine;
  return oneLine.slice(0, limit).trimEnd() + "…";
}

function renderJournal() {
  const patient = getSelectedPatient();
  journalList.innerHTML = "";
  journalEmpty.textContent =
    "Inga anteckningar ännu. Skapa den första ovan.";

  if (!patient || !patient.entries.length) {
    journalEmpty.hidden = false;
    return;
  }

  journalEmpty.hidden = true;

  const entries = [...patient.entries].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  for (const entry of entries) {
    const fullText = entry.text || "";
    const previewText = entryPreview(fullText);

    const block = document.createElement("article");
    block.className = "journal-entry";
    block.dataset.entryId = entry.id;
    block.dataset.preview = previewText;

    const original = document.createElement("button");
    original.type = "button";
    original.className = "journal-entry__original";

    const dateEl = document.createElement("strong");
    dateEl.className = "journal-entry__date";
    dateEl.textContent = formatDate(entry.createdAt);

    const textEl = document.createElement("p");
    textEl.className = "journal-entry__text";
    textEl.textContent = previewText;

    original.appendChild(dateEl);
    original.appendChild(textEl);
    bindEntryOpenTrigger(original, entry.id, textEl, fullText, previewText);

    const actions = document.createElement("div");
    actions.className = "journal-entry__actions";
    actions.hidden = true;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "text-link";
    editBtn.textContent = "Redigera";
    editBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      openEditModal(entry.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete-entry";
    deleteBtn.textContent = "Radera";
    deleteBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      requestDeleteEntry(entry.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    block.appendChild(original);
    block.appendChild(actions);
    journalList.appendChild(block);
  }
}

function openModal(mode, entryId) {
  modalMode = mode;
  modalEntryId = entryId || "";
  modalText.value = "";
  modalDate.value = todayDateInputValue();
  modalDelete.hidden = mode !== "edit";

  if (mode === "edit") {
    modalTitle.textContent = "Redigera anteckning";
    const patient = getSelectedPatient();
    const entry = patient && patient.entries.find((e) => e.id === entryId);
    if (entry) {
      modalText.value = entry.text || "";
      modalDate.value = isoToDateInputValue(entry.createdAt);
    }
  } else {
    modalTitle.textContent = "Ny anteckning";
  }

  modalBackdrop.hidden = false;
  modalText.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  modalText.value = "";
  modalDate.value = todayDateInputValue();
  modalEntryId = "";
  modalMode = "entry";
  modalDelete.hidden = true;
}

function openEditModal(entryId) {
  openModal("edit", entryId);
}

function openDeleteModal() {
  const patient = getSelectedPatient();
  if (!patient || !isSavedCustomer(patient)) return;

  deleteCustomerName.textContent = customerLabel(patient);
  deleteModalBackdrop.hidden = false;
}

function closeDeleteModal() {
  deleteModalBackdrop.hidden = true;
  deleteCustomerName.textContent = "";
}

async function confirmDeleteCustomer() {
  if (deleting) return;

  const patient = getSelectedPatient();
  if (!patient || !isSavedCustomer(patient)) return;

  const patientId = patient.id;
  deleting = true;
  deleteModalConfirm.disabled = true;
  showLoadNotice("Raderar…");

  try {
    await deletePatient(patientId);
    patients = patients.filter((p) => p.id !== patientId);
    selectedId = "";
    closeDeleteModal();
    fillCustomerSelect();
    selectFirstCustomer();
    showLoadNotice("Kunden och anteckningarna är raderade.");
    setTimeout(() => showLoadNotice(""), 2500);
  } catch (error) {
    showLoadNotice("Kunde inte radera: " + authErrorMessage(error), true);
  } finally {
    deleting = false;
    deleteModalConfirm.disabled = false;
  }
}

async function saveModal() {
  const text = modalText.value.trim();
  if (!text) {
    modalText.focus();
    return;
  }

  const patient = getSelectedPatient();
  if (!patient) return;

  const createdAt = dateInputToIso(modalDate.value || todayDateInputValue());

  if (modalMode === "edit") {
    const entry = patient.entries.find((e) => e.id === modalEntryId);
    if (!entry) return;
    entry.text = text;
    entry.createdAt = createdAt;
    delete entry.additions;
  } else {
    patient.entries.push({
      id: makeId(),
      createdAt: createdAt,
      text: text,
    });
  }

  closeModal();
  renderJournal();
  await persistPatient(patient);
}

async function deleteCurrentEntry() {
  if (modalMode !== "edit" || !modalEntryId) return;
  deleteEntryModalBackdrop.hidden = false;
}

function requestDeleteEntry(entryId) {
  if (!entryId) return;
  modalMode = "edit";
  modalEntryId = entryId;
  deleteEntryModalBackdrop.hidden = false;
}

function closeDeleteEntryModal() {
  deleteEntryModalBackdrop.hidden = true;
}

async function confirmDeleteEntry() {
  if (deleting) return;

  const patient = getSelectedPatient();
  if (!patient || !modalEntryId) return;

  deleting = true;
  deleteEntryModalConfirm.disabled = true;
  showLoadNotice("Raderar…");

  try {
    patient.entries = patient.entries.filter((e) => e.id !== modalEntryId);
    closeDeleteEntryModal();
    closeModal();
    renderJournal();
    await persistPatient(patient);
    showLoadNotice("Anteckningen är raderad.");
    setTimeout(() => showLoadNotice(""), 2500);
  } catch (error) {
    showLoadNotice("Kunde inte radera: " + authErrorMessage(error), true);
  } finally {
    deleting = false;
    deleteEntryModalConfirm.disabled = false;
  }
}

async function applyCustomerChange(value) {
  if (selectedId && selectedId !== value) {
    removeUnsavedDraft(selectedId);
  }

  if (value === NEW_CUSTOMER) {
    const patient = {
      id: makeId(),
      contact: emptyContact(),
      entries: [],
      healthDeclaration: null,
    };
    patients.push(patient);
    selectedId = patient.id;
    fillCustomerSelect(patient.id);
    lastCustomerSelectValue = patient.id;
    currentView = "kundregister";
    lastView = "kundregister";
    kundregisterScreen = "form";
    updateMenuActiveState();
    writeContactForm(patient.contact);
    syncVisibility();
    showLoadNotice("");
    document.getElementById("field-namn").focus();
    return;
  }

  selectedId = value;
  const patient = getSelectedPatient();
  if (patient) {
    writeContactForm(patient.contact);
  }
  syncVisibility();
}

async function onCustomerChange() {
  const value = customerSelect.value;

  if (!(await confirmDiscardUnsavedChanges())) {
    customerSelect.value = lastCustomerSelectValue;
    return;
  }

  discardContactFormEdits();
  lastCustomerSelectValue = value;
  await applyCustomerChange(value);
}

function isHealthModalOpen() {
  return !hdModalBackdrop.hidden;
}

function closeHealthModal() {
  hdModalBackdrop.hidden = true;
  hdModalBody.innerHTML = "";
}

function openHealthModal() {
  const patient = getSelectedPatient();
  if (!patient) return;

  if (!isSavedCustomer(patient)) {
    showLoadNotice("Spara kunden i kundregistret innan hälsodeklaration.", true);
    setTimeout(() => showLoadNotice(""), 3500);
    return;
  }

  const existing = normalizeHealthDeclaration(patient.healthDeclaration);
  if (existing) {
    renderHealthView(existing);
  } else {
    renderHealthForm();
  }
  hdModalBackdrop.hidden = false;
}

function renderHealthView(declaration) {
  hdModalTitle.textContent = "Hälsodeklaration";
  hdModalSub.textContent =
    "Sparad " + formatDate(declaration.updatedAt) + " · endast visning";
  hdModalCancel.hidden = true;
  hdModalSave.hidden = true;
  hdModalClose.hidden = false;
  if (hdModalReplace) hdModalReplace.hidden = false;

  const parts = ['<p class="hd-view-meta">Uppgifter från formuläret (ej juridisk blankett).</p>'];
  for (const question of HEALTH_QUESTIONS) {
    parts.push(
      '<div class="hd-view-row">' +
        '<span class="hd-view-q">' +
        escapeHtml(question.label) +
        "</span>" +
        '<span class="hd-view-a">' +
        escapeHtml(formatAnswerLabel(question, declaration.answers)) +
        "</span>" +
        "</div>"
    );
  }

  const comment = (declaration.comment || "").trim();
  if (comment) {
    parts.push(
      '<div class="hd-view-comment"><strong>Kommentar</strong><p>' +
        escapeHtml(comment) +
        "</p></div>"
    );
  }

  hdModalBody.innerHTML = parts.join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHealthForm(options) {
  const rewriting = Boolean(options && options.rewriting);
  hdModalTitle.textContent = rewriting ? "Skriv om hälsodeklaration" : "Hälsodeklaration";
  hdModalSub.textContent = rewriting
    ? "Fyll i hela deklarationen på nytt. När du sparar ersätts den gamla helt (allt eller inget)."
    : "Fyll i för den här kunden. Inga kontaktfält — de finns i kundregistret.";
  hdModalCancel.hidden = false;
  hdModalSave.hidden = false;
  hdModalClose.hidden = true;
  if (hdModalReplace) hdModalReplace.hidden = true;

  const parts = [];
  for (const question of HEALTH_QUESTIONS) {
    parts.push('<div class="hd-question" data-q="' + question.id + '">');
    parts.push(
      '<span class="hd-question__label" id="hd-label-' +
        question.id +
        '">' +
        escapeHtml(question.label) +
        "</span>"
    );

    if (question.type === "yesno" || question.type === "yesno_detail") {
      parts.push('<div class="hd-options" role="radiogroup" aria-labelledby="hd-label-' + question.id + '">');
      parts.push(
        '<label><input type="radio" name="hd-' +
          question.id +
          '" value="ja" data-hd-main="' +
          question.id +
          '" /> Ja</label>'
      );
      parts.push(
        '<label><input type="radio" name="hd-' +
          question.id +
          '" value="nej" data-hd-main="' +
          question.id +
          '" /> Nej</label>'
      );
      parts.push("</div>");
      if (question.type === "yesno_detail") {
        parts.push(
          '<div class="hd-detail" data-detail-for="' +
            question.id +
            '" hidden>' +
            "<label for=\"hd-detail-" +
            question.detailId +
            '">' +
            escapeHtml(question.detailLabel) +
            "</label>" +
            '<input id="hd-detail-' +
            question.detailId +
            '" type="text" data-hd-detail="' +
            question.detailId +
            '" />' +
            "</div>"
        );
      }
    } else if (question.type === "choice") {
      parts.push('<div class="hd-options" role="radiogroup" aria-labelledby="hd-label-' + question.id + '">');
      for (const opt of question.options) {
        parts.push(
          '<label><input type="radio" name="hd-' +
            question.id +
            '" value="' +
            opt.value +
            '" data-hd-main="' +
            question.id +
            '" /> ' +
            escapeHtml(opt.label) +
            "</label>"
        );
      }
      parts.push("</div>");
    } else if (question.type === "text" || question.type === "textarea") {
      const rows = question.type === "textarea" ? question.rows || 10 : 1;
      if (question.type === "textarea") {
        parts.push(
          '<div class="hd-text">' +
            '<textarea data-hd-text="' +
            question.id +
            '" rows="' +
            rows +
            '" placeholder="' +
            escapeHtml(question.placeholder || "") +
            '" aria-labelledby="hd-label-' +
            question.id +
            '"></textarea>' +
            "</div>"
        );
      } else {
        parts.push(
          '<div class="hd-text"><input type="text" data-hd-text="' +
            question.id +
            '" placeholder="' +
            escapeHtml(question.placeholder || "") +
            '" aria-labelledby="hd-label-' +
            question.id +
            '" /></div>'
        );
      }
    }

    parts.push("</div>");
  }

  parts.push(
    '<div class="hd-comment">' +
      '<label for="hd-comment">Kommentar</label>' +
      '<textarea id="hd-comment" rows="3" placeholder="Valfritt"></textarea>' +
      "</div>"
  );

  hdModalBody.innerHTML = parts.join("");

  hdModalBody.querySelectorAll("input[data-hd-main]").forEach(function (input) {
    input.addEventListener("change", function () {
      syncHealthDetailVisibility();
      updateHealthSaveButtonState();
    });
  });
  syncHealthDetailVisibility();
  updateHealthSaveButtonState();
}

/** Krysfrågor som måste vara ifyllda för att Spara ska aktiveras. */
function isRequiredHealthChoiceQuestion(question) {
  // Blodtryck är valfritt (liksom fritextfält)
  if (question.id === "blodtryck") return false;
  return question.type === "yesno" || question.type === "yesno_detail";
}

function healthFormIsComplete() {
  if (!hdModalBody) return false;
  for (const question of HEALTH_QUESTIONS) {
    if (!isRequiredHealthChoiceQuestion(question)) continue;
    const selected = hdModalBody.querySelector(
      'input[data-hd-main="' + question.id + '"]:checked'
    );
    if (!selected) return false;
  }
  return true;
}

function updateHealthSaveButtonState() {
  if (!hdModalSave || hdModalSave.hidden) return;
  hdModalSave.disabled = !healthFormIsComplete();
}

function syncHealthDetailVisibility() {
  for (const question of HEALTH_QUESTIONS) {
    if (question.type !== "yesno_detail") continue;
    const wrap = hdModalBody.querySelector('[data-detail-for="' + question.id + '"]');
    if (!wrap) continue;
    const selected = hdModalBody.querySelector(
      'input[data-hd-main="' + question.id + '"]:checked'
    );
    wrap.hidden = !(selected && selected.value === question.detailWhen);
  }
}

function readHealthForm() {
  const answers = emptyHealthAnswers();
  for (const question of HEALTH_QUESTIONS) {
    if (question.type === "text" || question.type === "textarea") {
      const input = hdModalBody.querySelector('[data-hd-text="' + question.id + '"]');
      answers[question.id] = input ? input.value.trim() : "";
      continue;
    }

    const selected = hdModalBody.querySelector(
      'input[data-hd-main="' + question.id + '"]:checked'
    );
    answers[question.id] = selected ? selected.value : "";

    if (question.detailId) {
      const detail = hdModalBody.querySelector(
        '[data-hd-detail="' + question.detailId + '"]'
      );
      answers[question.detailId] =
        selected && selected.value === question.detailWhen && detail
          ? detail.value.trim()
          : "";
    }
  }

  const commentEl = document.getElementById("hd-comment");
  return {
    updatedAt: new Date().toISOString(),
    answers,
    comment: commentEl ? commentEl.value.trim() : "",
  };
}

async function saveHealthDeclaration() {
  if (saving) return;
  const patient = getSelectedPatient();
  if (!patient || !isSavedCustomer(patient)) return;
  if (!healthFormIsComplete()) {
    updateHealthSaveButtonState();
    return;
  }

  const ok = await confirmHealthDialog({
    title: "Spara hälsodeklarationen?",
    confirmLabel: "Spara",
    bodyHtml:
      "<p>Du kan inte komplettera den i efterhand.</p>" +
      "<p>Däremot kan du byta ut hela deklarationen senare via <strong>Skriv om</strong>.</p>",
  });
  if (!ok) return;

  saving = true;
  hdModalSave.disabled = true;
  try {
    patient.healthDeclaration = readHealthForm();
    closeHealthModal();
    await persistPatient(patient);
    showLoadNotice("Hälsodeklaration sparad.");
    setTimeout(() => showLoadNotice(""), 2500);
  } catch (error) {
    showLoadNotice("Kunde inte spara: " + authErrorMessage(error), true);
    updateHealthSaveButtonState();
  } finally {
    saving = false;
  }
}

async function startHealthRewrite() {
  const patient = getSelectedPatient();
  if (!patient || !isSavedCustomer(patient)) return;
  const ok = await confirmHealthDialog({
    title: "Skriv om hälsodeklarationen?",
    confirmLabel: "Skriv om",
    bodyHtml:
      "<p>Du fyller i allt på nytt.</p>" +
      "<p>När du sparar <strong>ersätts den gamla deklarationen helt</strong>.</p>",
  });
  if (!ok) return;
  renderHealthForm({ rewriting: true });
}

function bindEvents() {
  if (menuToggle) {
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleAppMenu();
    });
  }

  document.addEventListener("click", function (event) {
    if (!appMenu || appMenu.hidden) return;
    const wrap = document.querySelector(".app-menu-wrap");
    if (wrap && !wrap.contains(event.target)) {
      closeAppMenu();
    }
  });

  settingsLink.addEventListener("click", async function (event) {
    event.preventDefault();
    closeAppMenu();
    if (!(await confirmDiscardUnsavedChanges())) return;
    discardContactFormEdits();
    window.location.href = "Installningar.html";
  });

  logoutLink.addEventListener("click", async function (event) {
    event.preventDefault();
    closeAppMenu();
    if (!(await confirmDiscardUnsavedChanges())) return;
    discardContactFormEdits();
    await logOut();
    window.location.href = "Inloggning.html";
  });

  kundregisterView.addEventListener("submit", saveContact);
  cancelContactBtn.addEventListener("click", function () {
    void cancelContact();
  });

  if (newCustomerBtn) {
    newCustomerBtn.addEventListener("click", async function () {
      if (kundregisterScreen === "form") {
        if (!(await confirmDiscardUnsavedChanges())) return;
        discardContactFormEdits();
        if (selectedId) removeUnsavedDraft(selectedId);
      }
      await applyCustomerChange(NEW_CUSTOMER);
    });
  }

  contactFields.forEach(function (fieldId) {
    const el = document.getElementById(fieldId);
    el.addEventListener("input", function () {
      updateSaveButtonState();
    });
    if (fieldId === "field-fodelsedata") {
      el.addEventListener("blur", function () {
        const formatted = formatBirthDateInput(el.value);
        if (formatted !== el.value) {
          el.value = formatted;
          updateSaveButtonState();
        }
      });
    }
    if (fieldId === "field-mobil") {
      el.addEventListener("blur", function () {
        const formatted = formatSwedishMobile(el.value);
        if (formatted) {
          el.value = formatted;
        }
        updateSaveButtonState();
      });
    }
  });

  customerSelect.addEventListener("focus", function () {
    lastCustomerSelectValue = customerSelect.value;
  });
  customerSelect.addEventListener("change", onCustomerChange);

  newEntryBtn.addEventListener("click", function () {
    openModal("entry");
  });

  modalCancel.addEventListener("click", closeModal);
  modalSave.addEventListener("click", saveModal);
  modalDelete.addEventListener("click", deleteCurrentEntry);

  deleteCustomerBtn.addEventListener("click", openDeleteModal);
  deleteModalCancel.addEventListener("click", closeDeleteModal);
  deleteModalConfirm.addEventListener("click", confirmDeleteCustomer);
  blockKeyboardOnButton(deleteModalCancel);
  blockKeyboardOnButton(deleteModalConfirm);

  deleteEntryModalCancel.addEventListener("click", closeDeleteEntryModal);
  deleteEntryModalConfirm.addEventListener("click", confirmDeleteEntry);
  blockKeyboardOnButton(deleteEntryModalCancel);
  blockKeyboardOnButton(deleteEntryModalConfirm);

  unsavedModalCancel.addEventListener("click", function () {
    closeUnsavedModal(false);
  });
  unsavedModalConfirm.addEventListener("click", function () {
    closeUnsavedModal(true);
  });

  if (phoneDupModalCancel) {
    phoneDupModalCancel.addEventListener("click", function () {
      closePhoneDupModal(false);
    });
  }
  if (phoneDupModalConfirm) {
    phoneDupModalConfirm.addEventListener("click", function () {
      closePhoneDupModal(true);
    });
  }

  if (hdConfirmModalCancel) {
    hdConfirmModalCancel.addEventListener("click", function () {
      closeHealthConfirmModal(false);
    });
  }
  if (hdConfirmModalConfirm) {
    hdConfirmModalConfirm.addEventListener("click", function () {
      closeHealthConfirmModal(true);
    });
  }
  if (hdConfirmModalBackdrop) {
    hdConfirmModalBackdrop.addEventListener("click", function (event) {
      if (event.target === hdConfirmModalBackdrop) closeHealthConfirmModal(false);
    });
  }

  hdBtn.addEventListener("click", openHealthModal);
  if (openKundregisterBtn) {
    openKundregisterBtn.addEventListener("click", async function () {
      await setActiveView("kundregister");
    });
  }
  if (openContactBtn) {
    openContactBtn.addEventListener("click", async function () {
      if (!selectedId) return;
      await openCustomerForm(selectedId);
    });
  }
  if (openNotesBtn) {
    openNotesBtn.addEventListener("click", async function () {
      await setActiveView("journal");
    });
  }
  hdModalCancel.addEventListener("click", closeHealthModal);
  hdModalClose.addEventListener("click", closeHealthModal);
  hdModalSave.addEventListener("click", saveHealthDeclaration);
  if (hdModalReplace) {
    hdModalReplace.addEventListener("click", startHealthRewrite);
  }
  hdModalBackdrop.addEventListener("click", function (event) {
    if (event.target === hdModalBackdrop) closeHealthModal();
  });

  window.addEventListener("beforeunload", function (event) {
    if (isContactFormDirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  modalBackdrop.addEventListener("click", function (event) {
    if (event.target === modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (
      isDeleteModalOpen() ||
      isDeleteEntryModalOpen() ||
      isUnsavedModalOpen() ||
      isPhoneDupModalOpen()
    ) {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (event.key === "Escape" && isHealthModalOpen()) {
      closeHealthModal();
      return;
    }
    if (event.key === "Escape" && isEntryModalOpen()) {
      closeModal();
    }
  });
}

async function init() {
  const versionFooter = document.getElementById("app-version-footer");
  if (versionFooter) versionFooter.textContent = formatAppVersion();

  await requireJournalAccess();
  bindEvents();

  showLoadNotice("Hämtar data…");
  try {
    patients = await loadAllPatients();
    patients = patients
      .filter((p) => {
        const namn = (p.contact.namn || "").trim();
        return namn && namn !== "Testkund (exempel)";
      })
      .map(function (p) {
        return {
          ...p,
          entries: normalizeEntries(p.entries),
          healthDeclaration: normalizeHealthDeclaration(p.healthDeclaration),
        };
      });
    showLoadNotice("");
  } catch (error) {
    showLoadNotice("Kunde inte hämta data: " + authErrorMessage(error), true);
    patients = [];
  }

  fillCustomerSelect();
  selectFirstCustomer();
  lastCustomerSelectValue = customerSelect.value;
  lastView = getActiveView();
  updateMenuActiveState();
}

init();
