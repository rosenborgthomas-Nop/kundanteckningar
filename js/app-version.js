/**
 * Enda versionsrutinen i KundAnteckningar.
 * Format som visas i appen: ååmmdd vxx  (t.ex. 260912 v01)
 *
 * RUTIN: ändra BARA när vi ska bygga/skicka en ny APK — inte vid vanlig utveckling.
 * - Ny APK samma dag: höj APP_VERSION_SEQ (2, 3, …).
 * - Ny APK annan dag: sätt APP_VERSION_DATE till dagens ååmmdd och APP_VERSION_SEQ = 1.
 * - Om SEQ skulle bli 100: sätt till 1 (sällan om ni bara bump:ar vid APK).
 *
 * Håll android/app/build.gradle versionName i fas med formatAppVersion() vid APK-bygge.
 */
export const APP_VERSION_DATE = "260913";
export const APP_VERSION_SEQ = 1;

function normalizedSeq(seq) {
  const n = Number(seq) || 1;
  return ((Math.max(1, Math.floor(n)) - 1) % 99) + 1;
}

export function formatAppVersion() {
  const xx = String(normalizedSeq(APP_VERSION_SEQ)).padStart(2, "0");
  return APP_VERSION_DATE + " v" + xx;
}
