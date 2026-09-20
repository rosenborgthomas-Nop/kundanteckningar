/**
 * Enda versionsrutinen i KundAnteckningar.
 * Format som visas i appen: ååmmdd vxx  (t.ex. 260916 v01)
 *
 * RUTIN vid publicering (push till GitHub Pages):
 * 1. Bumpa APP_VERSION_DATE / APP_VERSION_SEQ här.
 * 2. Sätt samma version i public/sw.js → CACHE_NAME (`kundanteckningar-ååmmdd-vxx`).
 * - Samma dag: höj SEQ. Ny dag: nytt datum + SEQ = 1.
 *
 * Android-APK (reserv): håll även android/app/build.gradle i fas om ni bygger APK.
 */
export const APP_VERSION_DATE = "260921";
export const APP_VERSION_SEQ = 6;

function normalizedSeq(seq) {
  const n = Number(seq) || 1;
  return ((Math.max(1, Math.floor(n)) - 1) % 99) + 1;
}

export function formatAppVersion() {
  const xx = String(normalizedSeq(APP_VERSION_SEQ)).padStart(2, "0");
  return APP_VERSION_DATE + " v" + xx;
}
