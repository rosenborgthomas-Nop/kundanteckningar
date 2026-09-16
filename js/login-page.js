import {
  authErrorMessage,
  factoryResetLocalData,
  needsSetup,
  setupPassword,
  unlockWithPassword,
} from "./auth.js";
import { formatAppVersion } from "./app-version.js";
import { initPasswordToggles } from "./password-toggle.js";

const weekdays = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

const form = document.getElementById("login-form");
const loginTitle = document.getElementById("login-title");
const passwordInput = document.getElementById("password");
const passwordRepeatInput = document.getElementById("password-repeat");
const repeatField = document.getElementById("repeat-field");
const noticeEl = document.getElementById("notice");
const submitBtn = document.getElementById("submit-btn");
const modeSwitch = document.getElementById("mode-switch");
const dateEl = document.getElementById("clock-date");
const timeEl = document.getElementById("clock-time");
const emailField = document.getElementById("email-field");
const appChoice = document.getElementById("app-choice");
const configNotice = document.getElementById("config-notice");

let setupMode = false;

function showNotice(text, isConfig) {
  if (!text) {
    noticeEl.hidden = true;
    noticeEl.textContent = "";
    noticeEl.className = "";
    return;
  }
  noticeEl.hidden = false;
  noticeEl.className = isConfig ? "notice notice--config" : "notice";
  noticeEl.textContent = text;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function updateClock() {
  const now = new Date();
  const weekday = weekdays[now.getDay()];
  const datePart = now.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  dateEl.textContent = capitalize(weekday) + " " + datePart;
  timeEl.textContent = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function syncUi() {
  if (emailField) emailField.hidden = true;
  if (appChoice) appChoice.hidden = true;
  if (configNotice) configNotice.hidden = true;

  repeatField.hidden = !setupMode;
  passwordInput.autocomplete = setupMode ? "new-password" : "current-password";
  passwordInput.minLength = 8;

  if (setupMode) {
    loginTitle.textContent = "Skapa lösenord";
    submitBtn.textContent = "Skapa och öppna";
    modeSwitch.innerHTML =
      '<p class="mode-switch__hint">Första gången <strong>i den här webbläsaren</strong>: välj ett lösenord (minst 8 tecken). Telefonen och datorn har separata lösenord/databaser.</p>';
  } else {
    loginTitle.textContent = "Lås upp";
    submitBtn.textContent = "Lås upp";
    modeSwitch.innerHTML =
      '<button type="button" class="text-link" id="reset-local-btn">Glömt lösenord? Radera lokal data…</button>';
    const resetBtn = document.getElementById("reset-local-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", onFactoryReset);
    }
  }
}

async function onFactoryReset() {
  const ok = window.confirm(
    "Detta raderar all lokal kunddata på enheten och låter dig skapa ett nytt lösenord.\n\nFortsätt?"
  );
  if (!ok) return;
  const ok2 = window.confirm(
    "Sista varningen: kundregister, anteckningar och hälsodeklarationer försvinner permanent."
  );
  if (!ok2) return;
  try {
    await factoryResetLocalData();
    setupMode = true;
    syncUi();
    showNotice("Lokal data raderad. Skapa ett nytt lösenord.");
  } catch (e) {
    showNotice(authErrorMessage(e));
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showNotice("");
  const password = passwordInput.value;
  const repeat = passwordRepeatInput ? passwordRepeatInput.value : "";

  submitBtn.disabled = true;
  try {
    if (setupMode) {
      if (!password || password.length < 8) {
        throw new Error("Lösenordet måste vara minst 8 tecken.");
      }
      if (password !== repeat) {
        throw new Error("Lösenorden matchar inte.");
      }
      await setupPassword(password, repeat);
    } else {
      if (password.length < 8) {
        throw new Error("Lösenordet måste vara minst 8 tecken.");
      }
      await unlockWithPassword(password);
    }
    window.location.href = "Journal.html";
  } catch (e) {
    console.error(e);
    showNotice(authErrorMessage(e) || "Kunde inte öppna databasen.");
  } finally {
    submitBtn.disabled = false;
  }
});

initPasswordToggles(form);
updateClock();
setInterval(updateClock, 1000);

const versionFooter = document.getElementById("app-version-footer");
if (versionFooter) versionFooter.textContent = formatAppVersion();

(async () => {
  try {
    setupMode = await needsSetup();
  } catch (_) {
    setupMode = true;
  }
  syncUi();
})();
