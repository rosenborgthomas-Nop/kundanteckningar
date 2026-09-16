# KundAnteckningar — installera på Android

Appen är en lokal Capacitor-app med krypterad SQLite (SQLCipher). Ingen Firebase-journal.

## Version (enda rutinen)

Visas i appen som **`ååmmdd vxx`** (t.ex. `260912 v01`).

**Bumpa bara när ni bygger/skickar APK** — inte under vanlig utveckling i webbläsaren.

1. Redigera `js/app-version.js` (`APP_VERSION_DATE` / `APP_VERSION_SEQ`).
2. Sätt samma text i `android/app/build.gradle` → `versionName` (och höj `versionCode`, t.ex. `26091202`).
3. `npm run cap:sync` → bygg APK i Android Studio.

## Förutsättningar (utvecklare)

- Node.js + npm
- Android Studio (rekommenderas för att bygga APK)
- Android SDK (`ANDROID_HOME`, t.ex. `%LOCALAPPDATA%\Android\Sdk`)

## Bygg och kör

```powershell
cd Journalsystem
npm install
npm run build
npx cap sync android
npx cap open android
```

I Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

> Om `gradlew assembleDebug` failar med SSL/certifikat i terminalen: bygg via Android Studio i stället (Studio hanterar ofta Gradle/nät bättre).

Debug-APK hamnar typiskt under:

`android\app\build\outputs\apk\debug\app-debug.apk`

## Installera hos Maria

1. Kopiera `app-debug.apk` till telefonen (USB, Drive, etc.).
2. Öppna filen på telefonen och tillåt installation från den källan (en gång).
3. Starta **KundAnteckningar** från hemskärmsikonen.
4. Första gången: skapa lösenord (minst 8 tecken).
5. Nästa gång: lås upp med samma lösenord.

## Användning

- **Lås upp** → arbeta med kunder / anteckningar / hälsodeklaration
- **Logga ut** → databasen låses
- **Byt lösenord** under Inställningar (omkrypterar databasen)
- **Glömt lösenord** → enda vägen är “Radera lokal data” på upplåsningsskärmen (all kunddata försvinner)

## Utveckling i webbläsare

```powershell
npm run dev
```

Öppna den lokala Vite-URL:en. Webben använder jeep-sqlite (WASM); på Android används native SQLCipher.
