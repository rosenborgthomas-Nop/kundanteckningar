# KundAnteckningar — så här jobbar du

Primärt flöde (som nopEKONOMI): **webbapp/PWA** via GitHub Pages.  
Kunddata ligger **krypterat lokalt** i webbläsaren — inte på GitHub.

Live-adress (efter publicering):  
https://rosenborgthomas-nop.github.io/kundanteckningar/Inloggning.html

---

## 1. Testa på datorn

```powershell
cd Journalsystem
npm install
npm run dev
```

Öppna länken Vite visar (t.ex. `http://localhost:5173/Inloggning.html`).

Ändra och testa här först. Ingen push behövs för lokal test.

---

## 2. Publicera så telefonen får uppdateringen

1. Bumpa version i **båda**:
   - `js/app-version.js` (samma dag → höj SEQ; ny dag → nytt datum + SEQ = 1)
   - `public/sw.js` → `CACHE_NAME` (t.ex. `kundanteckningar-260916-v02`)
2. Committa och **pusha till `main`** (be Cursor, eller gör själv).
3. Vänta 1–2 minuter medan GitHub Pages bygger.
4. Öppna/uppdatera appen på telefonen. Kontrollera versionsnumret längst ner.

Det är **push till GitHub** som uppdaterar telefonen — inte bara att du sparar filer lokalt.

---

## 3. Första gången på telefonen (Maria)

1. Öppna Chrome på telefonen.
2. Gå till:  
   https://rosenborgthomas-nop.github.io/kundanteckningar/Inloggning.html
3. Meny → **Lägg till på hemskärmen** (valfritt, ger app-ikon).
4. Skapa lösenord (minst 8 tecken).

### Om Maria redan har data i den gamla APK-appen

1. I APK: Inställningar → Backup → spara `.ka`-fil.
2. Kopiera filen till telefonen (t.ex. Nedladdningar).
3. I PWA: Inställningar → Backup → återställ från `.ka`.
4. När allt ser bra ut kan APK avinstalleras.

---

## 4. Viktigt att komma ihåg

| | |
|---|---|
| GitHub är **public** | Bara koden syns — inte kunddata |
| Data per enhet | Dator ≠ telefon (använd Backup för att flytta) |
| Glömt lösenord | Radera lokal data på inloggningen (all lokal data försvinner) |
| Android-APK | Finns kvar som reserv — se `INSTALL-ANDROID.md` |

---

## 5. Vanliga npm-kommandon

| Kommando | Syfte |
|---|---|
| `npm run dev` | Lokal test i webbläsaren |
| `npm run build` | Bygg `dist/` (Pages gör detta automatiskt vid push) |
| `npm run cap:sync` | Bara om du bygger Android-APK igen |
