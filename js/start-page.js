import { logOut, requireJournalAccess } from "./auth.js";
import { formatAppVersion } from "./app-version.js";

const versionFooter = document.getElementById("app-version-footer");
if (versionFooter) versionFooter.textContent = formatAppVersion();

const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async (event) => {
    event.preventDefault();
    await logOut();
    window.location.href = "Inloggning.html";
  });
}

requireJournalAccess();
