import {
  authErrorMessage,
  changePassword,
  logOut,
  requireJournalAccess,
} from "./auth.js";
import { getDb, verifyUnlockedPassword } from "./db.js";
import { loadAllPatients, replaceAllPatients } from "./patients.js";
import { registerServiceWorker } from "./register-sw.js";
import {
  buildBackupFileText,
  formatBackupStamp,
  getLastBackupAt,
  pickBackupFileText,
  readBackupFileText,
  saveBackupToUser,
  setLastBackupAt,
} from "./backup.js";
import {
  MODE_FOLDER,
  ensureDirectoryPermission,
  folderFileExists,
  formatStorageStatus,
  getStorageMode,
  isFolderPickerSupported,
  pickDirectory,
  readPatientsFromFolder,
  saveDirectoryHandle,
  setStorageMode,
  writePatientsToFolder,
} from "./folder-storage.js";
import { initPasswordToggles } from "./password-toggle.js";

registerServiceWorker();

const hub = document.getElementById("settings-hub");
const passwordPanel = document.getElementById("password-panel");
const backupPanel = document.getElementById("backup-panel");
const storagePanel = document.getElementById("storage-panel");
const hubPasswordBtn = document.getElementById("hub-password-btn");
const hubBackupBtn = document.getElementById("hub-backup-btn");
const hubStorageBtn = document.getElementById("hub-storage-btn");
const passwordBackBtn = document.getElementById("password-back-btn");
const backupBackBtn = document.getElementById("backup-back-btn");
const storageBackBtn = document.getElementById("storage-back-btn");

const form = document.getElementById("settings-form");
const currentInput = document.getElementById("current-password");
const newInput = document.getElementById("new-password");
const repeatInput = document.getElementById("new-password-repeat");
const noticeEl = document.getElementById("notice");
const savePasswordBtn = document.getElementById("save-password-btn");
const passwordHint = document.getElementById("password-hint");
const logoutLink = document.getElementById("logout-link");

const backupLastStamp = document.getElementById("backup-last-stamp");
const backupExportPassword = document.getElementById("backup-export-password");
const backupImportPassword = document.getElementById("backup-import-password");
const backupExportBtn = document.getElementById("backup-export-btn");
const backupImportBtn = document.getElementById("backup-import-btn");
const backupNoticeEl = document.getElementById("backup-notice");

const storageStatus = document.getElementById("storage-status");
const storagePhoneNote = document.getElementById("storage-phone-note");
const storageActions = document.getElementById("storage-actions");
const storagePassword = document.getElementById("storage-password");
const storagePickBtn = document.getElementById("storage-pick-btn");
const storageRebindBtn = document.getElementById("storage-rebind-btn");
const storageNoticeEl = document.getElementById("storage-notice");

function showPanel(name) {
  hub.hidden = name !== "hub";
  passwordPanel.hidden = name !== "password";
  backupPanel.hidden = name !== "backup";
  storagePanel.hidden = name !== "storage";
}

function passwordFormCanSave() {
  const current = currentInput.value;
  const next = newInput.value;
  const repeat = repeatInput.value;
  return Boolean(
    current &&
      next &&
      repeat &&
      next === repeat &&
      next !== current &&
      next.length >= 8
  );
}

function getPasswordHintText() {
  const current = currentInput.value;
  const next = newInput.value;
  const repeat = repeatInput.value;

  if (!current) return "Börja med att ange nuvarande lösenord.";
  if (!next) return "Välj ett nytt lösenord (minst 8 tecken).";
  if (!repeat) return "Repetera det nya lösenordet.";
  if (next !== repeat) return "De nya lösenorden matchar inte.";
  if (next === current) {
    return "Nytt lösenord måste skilja sig från det nuvarande.";
  }
  if (next.length < 8) return "Nytt lösenord behöver vara minst 8 tecken.";
  return "Tryck Spara nytt lösenord när du är klar.";
}

function updatePasswordFormUi() {
  passwordHint.textContent = getPasswordHintText();
  savePasswordBtn.disabled = !passwordFormCanSave();
}

function showNotice(text, ok) {
  if (!text) {
    noticeEl.hidden = true;
    noticeEl.textContent = "";
    noticeEl.className = "";
    return;
  }
  noticeEl.hidden = false;
  noticeEl.className = ok ? "notice notice--ok" : "notice";
  noticeEl.textContent = text;
}

function showBackupNotice(text, ok) {
  if (!text) {
    backupNoticeEl.hidden = true;
    backupNoticeEl.textContent = "";
    backupNoticeEl.className = "";
    return;
  }
  backupNoticeEl.hidden = false;
  backupNoticeEl.className = ok ? "notice notice--ok" : "notice";
  backupNoticeEl.textContent = text;
}

function showStorageNotice(text, ok) {
  if (!text) {
    storageNoticeEl.hidden = true;
    storageNoticeEl.textContent = "";
    storageNoticeEl.className = "";
    return;
  }
  storageNoticeEl.hidden = false;
  storageNoticeEl.className = ok ? "notice notice--ok" : "notice";
  storageNoticeEl.textContent = text;
}

async function refreshBackupStamp() {
  const iso = await getLastBackupAt();
  backupLastStamp.textContent = formatBackupStamp(iso);
}

async function refreshStorageUi() {
  const supported = isFolderPickerSupported();
  const mode = await getStorageMode();
  storageStatus.textContent = formatStorageStatus(mode, supported);
  storagePhoneNote.hidden = supported;
  storageActions.hidden = !supported;
  storagePickBtn.hidden = mode === MODE_FOLDER;
  storageRebindBtn.hidden = mode !== MODE_FOLDER;
  if (mode === MODE_FOLDER) {
    storagePickBtn.hidden = true;
  }
}

/**
 * Bind vald mapp som originalplats.
 * Mapphanteraren MÅSTE öppnas direkt från klicket (innan confirm/await),
 * annars: "Must be handling a user gesture to show a file picker".
 * @param {boolean} rebind — true om redan i folder-läge och byter mapp
 */
async function bindFolderAsOriginal(rebind) {
  showStorageNotice("");
  const password = storagePassword.value;
  if (!verifyUnlockedPassword(password)) {
    showStorageNotice("Fel lösenord.");
    return;
  }

  // Första await = showDirectoryPicker, medan klickgesten fortfarande gäller.
  let dirHandle;
  try {
    dirHandle = await pickDirectory();
  } catch (e) {
    if (e && e.name === "AbortError") return;
    showStorageNotice(authErrorMessage(e));
    return;
  }

  if (!rebind) {
    const okStart = window.confirm(
      "Vill du spara originalet i den valda mappen i fortsättningen?\n\n" +
        "Programmet skapar filen kundanteckningar.ka där " +
        "(t.ex. bra om mappen synkas med OneDrive).\n\nFortsätt?"
    );
    if (!okStart) return;
  }

  const permitted = await ensureDirectoryPermission(dirHandle, "readwrite");
  if (!permitted) {
    showStorageNotice("Behörighet till mappen saknas.");
    return;
  }

  storagePickBtn.disabled = true;
  storageRebindBtn.disabled = true;
  try {
    const exists = await folderFileExists(dirHandle);
    let patients = await loadAllPatients();

    if (exists) {
      const useExisting = window.confirm(
        "Mappen har redan filen kundanteckningar.ka.\n\n" +
          "OK = använd filen i mappen (ersätter data här).\n" +
          "Avbryt = skriv över filen med data från den här enheten."
      );
      if (useExisting) {
        const imported = await readPatientsFromFolder(dirHandle, password);
        patients = imported.patients;
        await replaceAllPatients(patients);
      } else {
        await writePatientsToFolder(dirHandle, patients, password);
      }
    } else {
      await writePatientsToFolder(dirHandle, patients, password);
    }

    await saveDirectoryHandle(dirHandle);
    await setStorageMode(MODE_FOLDER);

    try {
      const db = getDb();
      if (db && typeof db.persist === "function") {
        await db.persist();
      }
    } catch (_) {
      /* ignore */
    }

    storagePassword.value = "";
    await refreshStorageUi();
    showStorageNotice(
      "Klart. Originalet sparas nu i mappen som filen kundanteckningar.ka (" +
        patients.length +
        " kunder).",
      true
    );
  } catch (e) {
    showStorageNotice(authErrorMessage(e));
  } finally {
    storagePickBtn.disabled = false;
    storageRebindBtn.disabled = false;
  }
}

[currentInput, newInput, repeatInput].forEach((el) => {
  el.addEventListener("input", updatePasswordFormUi);
});

hubPasswordBtn.addEventListener("click", function () {
  showNotice("");
  showPanel("password");
});

hubBackupBtn.addEventListener("click", async function () {
  showBackupNotice("");
  await refreshBackupStamp();
  showPanel("backup");
});

hubStorageBtn.addEventListener("click", async function () {
  showStorageNotice("");
  await refreshStorageUi();
  showPanel("storage");
});

passwordBackBtn.addEventListener("click", function () {
  showPanel("hub");
});

backupBackBtn.addEventListener("click", function () {
  showPanel("hub");
});

storageBackBtn.addEventListener("click", function () {
  showPanel("hub");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showNotice("");
  if (!passwordFormCanSave()) {
    updatePasswordFormUi();
    return;
  }
  savePasswordBtn.disabled = true;
  try {
    await changePassword(currentInput.value, newInput.value);
    await logOut();
    window.location.href = "Inloggning.html";
  } catch (e) {
    showNotice(authErrorMessage(e));
    updatePasswordFormUi();
  }
});

backupExportBtn.addEventListener("click", async function () {
  showBackupNotice("");
  const password = backupExportPassword.value;
  if (!verifyUnlockedPassword(password)) {
    showBackupNotice("Fel lösenord.");
    return;
  }
  backupExportBtn.disabled = true;
  try {
    const patients = await loadAllPatients();
    const { text, fileName, createdAt } = await buildBackupFileText(
      patients,
      password
    );
    await saveBackupToUser(text, fileName);
    await setLastBackupAt(createdAt);
    await refreshBackupStamp();
    backupExportPassword.value = "";
    showBackupNotice(
      "Backup skapad (" +
        patients.length +
        " kunder). Filen heter «" +
        fileName +
        "» och ligger i mappen Nedladdningar.",
      true
    );
  } catch (e) {
    showBackupNotice(authErrorMessage(e));
  } finally {
    backupExportBtn.disabled = false;
  }
});

backupImportBtn.addEventListener("click", async function () {
  showBackupNotice("");
  const password = backupImportPassword.value;
  if (!password) {
    showBackupNotice("Ange lösenordet som användes när backupen skapades.");
    return;
  }
  const ok = window.confirm(
    "Återställning ersätter ALLA kunder och anteckningar på den här enheten med innehållet i backup-filen.\n\nFortsätt?"
  );
  if (!ok) return;

  backupImportBtn.disabled = true;
  try {
    const text = await pickBackupFileText();
    const { patients } = await readBackupFileText(text, password);
    await replaceAllPatients(patients);
    backupImportPassword.value = "";
    showBackupNotice(
      "Återställning klar (" + patients.length + " kunder).",
      true
    );
  } catch (e) {
    showBackupNotice(authErrorMessage(e));
  } finally {
    backupImportBtn.disabled = false;
  }
});

storagePickBtn.addEventListener("click", () => bindFolderAsOriginal(false));
storageRebindBtn.addEventListener("click", () => bindFolderAsOriginal(true));

logoutLink.addEventListener("click", async (event) => {
  event.preventDefault();
  await logOut();
  window.location.href = "Inloggning.html";
});

initPasswordToggles(form);
initPasswordToggles(backupPanel);
initPasswordToggles(storagePanel);
updatePasswordFormUi();
showPanel("hub");

(async () => {
  const user = await requireJournalAccess();
  if (!user) return;
  await refreshBackupStamp();
  await refreshStorageUi();
})();
