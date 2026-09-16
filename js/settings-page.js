import {
  authErrorMessage,
  changePassword,
  logOut,
  requireJournalAccess,
} from "./auth.js";
import { verifyUnlockedPassword } from "./db.js";
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
import { initPasswordToggles } from "./password-toggle.js";

registerServiceWorker();

const hub = document.getElementById("settings-hub");
const passwordPanel = document.getElementById("password-panel");
const backupPanel = document.getElementById("backup-panel");
const hubPasswordBtn = document.getElementById("hub-password-btn");
const hubBackupBtn = document.getElementById("hub-backup-btn");
const passwordBackBtn = document.getElementById("password-back-btn");
const backupBackBtn = document.getElementById("backup-back-btn");

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

function showPanel(name) {
  hub.hidden = name !== "hub";
  passwordPanel.hidden = name !== "password";
  backupPanel.hidden = name !== "backup";
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

async function refreshBackupStamp() {
  const iso = await getLastBackupAt();
  backupLastStamp.textContent = formatBackupStamp(iso);
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

passwordBackBtn.addEventListener("click", function () {
  showPanel("hub");
});

backupBackBtn.addEventListener("click", function () {
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

logoutLink.addEventListener("click", async (event) => {
  event.preventDefault();
  await logOut();
  window.location.href = "Inloggning.html";
});

initPasswordToggles(form);
initPasswordToggles(backupPanel);
updatePasswordFormUi();
showPanel("hub");

(async () => {
  const user = await requireJournalAccess();
  if (!user) return;
  await refreshBackupStamp();
})();
