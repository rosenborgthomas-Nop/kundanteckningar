/** Registrerar service worker (PWA-uppdateringar via GitHub Pages). */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const swUrl = new URL("sw.js", document.baseURI || window.location.href);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl.href).catch(() => {});
  });
}
