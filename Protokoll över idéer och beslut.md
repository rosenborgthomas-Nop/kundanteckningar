# Protokoll över idéer och beslut

Det här är projektets eget minne. Det ska vara kort och praktiskt — tillräckligt
så att vi (eller en ny chatt) snabbt förstår *vad* som bestämts och *varför*,
utan att du behöver minnas allt själv.

**Rutin:** När vi tar ett beslut eller landar en idé värd att spara → en rad här.
Assistenten uppdaterar filen när vi avslutar ett tydligt steg, eller när du ber om det.

**Senast uppdaterad:** 2026-09-05

---

## Utseende (från omtankenhbg.se / Elementor)

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-28 | **Beslut** | Journalsystemet ska **matcha hemsidans stil** — färger och typsnitt från Elementors webbplatsinställningar (skärmdump sparad i chatten). |
| 2026-08-28 | **Beslut** | **Färgpalett:** teal/gröna toner (ljus → mörk), mörkgrön/svart för text, ljusgrå/vit för bakgrund och kort. **Inte** den blå kalenderstilen från bokningsprojektet. |
| 2026-08-28 | **Beslut** | **Rubriker:** elegant **serif** (samma familj som i Elementor-typsnittet på skärmdumpen). **Brödtext:** enkel sans-serif som komplement (väljs vid kodning). |
| 2026-08-28 | **Idé** | Exakta hex-koder kan plockas från Elementor genom att klicka på varje färgruta — valfritt; visuell matchning räcker till att börja. |
| 2026-08-28 | **Beslut** | **Resurser från hemsidan** ligger i mappen `Resurser från hemsidan/` (helskärmsreferens `Skärmklipp_HelBredd.png` m.m.). UI-färger följer Elementor (teal/grön), inte loggans röda som huvudfärg. |
| 2026-08-31 | **Beslut** | **Logga** på inloggning/start: `imgi_29_Logga-1-centrum-1.png` (ersätter `Logga.png`). |
| 2026-09-05 | **Pågår** | **Inloggningslogga:** flyttad från vattenstämpel bakom fälten till **absolut placering till höger om rubriken ”Inloggning”** (framhävd, `mix-blend-mode`). Användaren **inte helt nöjd** — finjustering av storlek/placering **parkerad** till nästa gång. |
| 2026-08-30 | **Beslut** | **Layoutmockup** för huvudvyn: `Resurser från hemsidan/mall för den stora sidan.png` — val av kund, växling Kundregister/Journal, journallista. |
| 2026-09-05 | **Beslut** | Inloggning/start-footer under test: **”ENDAST FÖR TESTNING”** (ersätter ”Endast Maria har tillgång…”). |
| 2026-09-05 | **Tillfälligt** | Röd sned **TEST**-stämpel över rubriken Journal (`Journal.html` → `.journal-test-stamp`). Lätt att ta bort (HTML-span + CSS-block). |

---

## Grundriktning

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-28 | **Beslut** | **Journalsystem** för massageinstitutet Omtanken (Maria Karmacsi, [omtankenhbg.se](https://www.omtankenhbg.se/)). Komplettering — inte ombyggnad av befintlig hemsida. |
| 2026-08-28 | **Beslut** | **Webbapp** som fungerar i webbläsaren på Android, surfplatta och dator. Ingen app i App Store. |
| 2026-08-28 | **Beslut** | Arbeta i **små steg**. Användaren ger konceptuell vägledning; assistenten kodar. |
| 2026-08-28 | **Beslut** | Systemet ska **inte användas av Maria förrän det är färdigt** — vi bygger ändå i delar under utveckling. |
| 2026-08-28 | **Beslut** | Projektet ska ha detta protokoll som **oberoende minne** — inte beroende av chatt historik. |

---

## Inloggning

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-28 | **Beslut** | **Layout:** allt i ett kort centrerat på skärmen (mindre vertikal sträckning på dator). Klocka inuti kortet med **fast min-höjd**. Logga som **vattenstämpel bakom** text och fält — **förankrad från kortets topp** (inte vertikalt centrerad), så ”Omtanken” syns på samma ställe på mobil och dator. |
| 2026-08-29 | **Viktigt** | När testtexten under rubriken togs bort: **labels och fält får inte flytta** från nuvarande position. Ersätt borttagen text med **tom vertikal yta** (`.sub--spaced` med `min-height`) så loggans placering och formulärets läge förblir oförändrat. |
| 2026-08-30 | **Beslut** | **Endast Maria** har tillgång. Inga kolleger, inga fler användare, ingen användarväljare. |
| 2026-08-30 | **Beslut** | Maria **måste logga in med lösenord** (för att förhindra obehöriga). Första gången: **skapa lösenord** + repetera. Därefter: lösenordsinloggning. |
| 2026-08-30 | **Beslut** | Inloggning lokalt (SHA-256) — **ersatt** 2026-08-30 av Firebase Authentication. |
| 2026-08-30 | **Beslut** | **OK** / **Logga in** + **Enter** → `Journal.html`. **Logga ut** via Firebase `signOut`. |
| 2026-08-30 | **Beslut** | **Firebase Authentication** för inloggning: e-post + lösenord. **Glömt lösenord?** → Firebase skickar återställningsmail. |
| 2026-08-30 | **Beslut** | Maria ska kunna **byta lösenord inne i programmet** (`Inställningar.html`). |
| 2026-08-30 | **Beslut** | Firebase tar **inte** över designen. Samma Omtanken-layout — bara logiken byts till Firebase SDK. |
| 2026-08-30 | **Beslut** | **Testmiljö:** utvecklarens e-post under utveckling. Marias e-post vid överlämning. |
| 2026-08-30 | **Beslut** | **Firestore** för patienter/journaler (samling `patients`). Regler: endast inloggad användare. Setup: `firebase-setup.txt`. |
| 2026-08-30 | **Beslut** | `ALLOW_SIGNUP` i `js/firebase-config.js` — `true` under utveckling, `false` vid överlämning till Maria. |
| 2026-08-31 | **Beslut** | Fältet behåller benämningen **E-post** (inte ”Användarnamn”). E-post är kontoidentitet i Firebase — inte öppen registrering för vem som helst. |
| 2026-08-31 | **Beslut** | För **bara Maria** (+ utvecklare i test): sätt `ALLOW_SIGNUP = false` när Maria tar över; ha **ett konto för Maria** och **ett för utvecklare i test** i Firebase Authentication; använd **HTTPS** i produktion (t.ex. Firebase Hosting). |
| 2026-09-04 | **Beslut** | **Idiotsäkerhet / reserv:** journaldata försvinner **inte** om e-postlådan dör. Backup via **Reservåtkomst** i Inställningar (ägare = Maria). Hon kan **lägga till** / **ta bort** reserv-e-post under egen insyn. Vid överlämning: `JOURNAL_OWNER_EMAIL` + `JOURNAL_RESERVE_EMAILS` i `firebase-config.js` så Maria och reserv är aktiva samtidigt. |
| 2026-09-04 | **Beslut** | Inloggning behåller fältet **E-post** (inte ”användare”). Webbläsaren kan spara e-post + lösenord (autocomplete) så Maria oftast bara bekräftar — enhetslösen är separat skydd. |
| 2026-08-31 | **Idé** | **BankID** vid inloggning — tekniskt möjligt men tungt (avtal, API, kostnad, egen backend). Ej prioriterat; e-post + lösenord räcker för endast Maria. |
| 2026-09-01 | **Viktigt** | **Inloggning** — nuvarande UX är målbilden: Firebase Auth, **E-post** + lösenord, **ögon** på lösenordsfält (ett öppet åt gången), glömt lösenord, session kvar tills **Logga ut**. Layout enligt `Inloggning.html`. |
| 2026-09-01 | **Viktigt** | **Byt lösenord** (`Inställningar.html`) — nuvarande UX är målbilden: dynamisk hjälptext, nedtonad **Spara** tills allt giltigt, nytt lösenord måste skilja sig från nuvarande (minst 6 tecken), **ögon** på alla fält. Firebase hanterar själva lösenordet. |
| 2026-08-30 | **Beslut** | **Återanvänd befintligt Firebase-projekt** om det uppfyller checklistan (Firestore EU, Auth e-post/lösenord) — skapa inte nytt i onödan. Kan dela projekt med bokning (`omtankenbokning`) med separat samling `patients`. |
| 2026-08-31 | **Beslut** | **Bokning och journal kopplas inte ihop.** Inget gemensamt kundregister. Bokning (`slots`) och journal (`patients`) är helt åtskilda — en kund kan bokas utan att finnas i journalens register, med flit. |
| 2026-08-31 | **Beslut** | **Kundregister:** sparas med **Spara** (höger). **Avbryt** (vänster) återställer eller tar bort utkast. Spara kräver **namn + minst ett telefonnummer**. |
| 2026-09-01 | **Beslut** | **Kundregister — osparade ändringar:** varning med **Avbryt** / **OK** vid byte av kund, vy, Inställningar, Logga ut (och vid stängning av flik om ändringar finns). |
| 2026-09-01 | **Jobb** | **Kundregister — formatering av fält** (födelsedata). |
| 2026-09-04 | **Klart** | **Födelsedata:** formateras automatiskt till **ÅÅÅÅ-MM-DD** (t.ex. ååmmdd, ååååmmdd). Tvåsiffriga år tolkas så att ålder blir 0–110. Det var det jobbet från 2026-09-01 syftade på. |
| 2026-08-31 | **Beslut** | Vid inloggning: **Kundregister** förvalt; **första kunden** i listan (alfabetisk ordning) visas om det finns kunder. Ingen testkund skapas automatiskt. |
| 2026-08-31 | **Beslut** | **Radera kund:** knapp i kundregistret (endast sparade kunder). Bekräftelsedialog med stark GDPR-/lagvarning. Radering tar bort kundregister **och hela journalen**. Avbryt/Radera aktiveras endast med mus — inte tangentbord. |
| 2026-08-31 | **Beslut** | **Unika kundnamn** — två kunder får inte ha samma namn (ignorerar skillnad mellan stora/små bokstäver). |

*Tidigare testmiljö med rullgardin, NY ANVÄNDARE och Maria Testmiljö — borttagen 2026-08-30.*

---

## Åtkomst

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-30 | **Beslut** | **En användare: Maria.** Inga kolleger ska vara med i bilden — varken nu eller planerat. |
| 2026-08-30 | **Beslut** | All journaldata tillhör Maria. Ingen `therapistId`, inget delat läge, ingen fleranvändararkitektur. |

*Tidigare beslut om flera användare, privat läge per terapeut och delat läge — **upphävda** 2026-08-30 (direktiv från Maria).*

---

## Teknik

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-28 | **Beslut** | **HTML + CSS + JavaScript** i webbläsaren. Assistenten skriver koden. |
| 2026-08-28 | **Beslut** | **Firebase Spark (gratis)** — Firestore för data, Authentication för inloggning. **Inget betalkort** behövs i nuvarande fas. |
| 2026-08-28 | **Beslut** | Data i **EU-region** när vi publicerar (GDPR). |
| 2026-08-30 | **Beslut** | **Ingen röstinspelning eller röstlagring** i journalsystemet. Ev. röstinmatning sköts av **andra leverantörer** (t.ex. Whisper Flow) — text klistras in i journalen som vanlig fritext. |
| 2026-08-30 | **Idé** | **Inställningar** i appen: byt lösenord (`Inställningar.html`), logga ut. |

### Firebase gratis (Spark) — räcker för text

| Gräns | Värde |
|-------|-------|
| Lagrad data (Firestore) | 1 GB |
| Läsningar | 50 000/dag |
| Skrivningar | 20 000/dag |

För ett litet massageinstitut: **tusentals patienter** och **tiotusentals textanteckningar** innan lagringsgränsen närmar sig.

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-09-05 | **Beslut** | **Firebase-användning:** vi vill ha **e-postvarning** när kvoterna närmar sig — trösklar **50 %**, **75 %** och **90 %** (trafik/MB m.m.). Sätts i Console (Usage and billing / budget alerts) när det är dags; inte via appen i första hand. |

---

## Patient — tre delar

| Datum | Typ | Beslut / idé |
|-------|-----|--------------|
| 2026-08-28 | **Beslut** | Varje patient har **tre delar**: (1) **kundregister** (personuppgifter), (2) hälsodeklaration, (3) journal (fritext med datum). |
| 2026-08-30 | **Beslut** | **Kundregister** innehåller alla kontaktuppgifter som finns på hälsodeklarationsblanketten: namn, födelsedata, adress, tel. hem, tel. arb, yrke, e-post — plus **personnummer (ååmmdd)**, **valfritt**. |
| 2026-08-30 | **Beslut** | **Personuppgifter finns bara i kundregistret** — inte som egen data i journalen eller dubblerat i hälsodeklarationen. Hälsodeklarationen handlar om hälsouppgifter (fil, formulär eller foto). |
| 2026-08-30 | **Beslut** | I **journalvyn**: snabb åtkomst till **kundregister** för vald patient (i mockupen: radioknapp **Kundregister** / **Journal** under kundvalet). |
| 2026-08-30 | **Beslut** | **Hälsodeklaration** skapas på ett av tre sätt: (1) **filöverföring** (txt, pdf, ev. fler), (2) **frågeformulär** i appen (frågorna kommer senare), (3) **foto** med telefonkameran. |
| 2026-09-05 | **Beslut** | **Hälsodeklaration i appen (formulär)** — **påbörjad/klar för formulärdelen:** knapp **Hälsodeklaration** efter radioknapparna (under dem på mobil), **endast när kunden är sparad**. Finns sparad → **visa** (ej redigera). Finns inte → **fyll i på plats**. Frågor/svar/kommentar enligt Marias PDF; **inga** kontaktfält, friskhetspåstående eller signering (Maria sköter “legal” på papper). `js/health-declaration.js`, fält på `patients.healthDeclaration`. |
| 2026-09-05 | **Beslut** | **Regelbunden medicin** och **Annat att tillägga** = textytor **10 rader**. |
| 2026-09-05 | **Beslut** | Radiotext: **Kundregister · XXst** (antal sparade kunder). |
| 2026-08-30 | **Beslut** | Marias hälsodeklaration finns som PDF i `Resurser från hemsidan/`. Se avsnittet *Hälsodeklaration — innehåll* nedan. |
| 2026-08-30 | **Beslut** | En sparad hälsodeklaration **kan inte ändras** — bara **bytas ut** (ny fil / nytt formulär / nytt foto ersätter den gamla). |
| 2026-08-28 | **Beslut** | **Journal:** **flera** fritextanteckningar per patient, varje med **eget datum**. |
| 2026-08-30 | **Upphävt** | Tidigare: originaltext oföränderlig + tilläggsprocedur. **Ersatt** 2026-09-04. |
| 2026-09-04 | **Beslut** | Efter avstämning med Maria: journalen behandlas **inte** som strikt lagstadgad patientjournal i hennes modell. **Tilläggsproceduren skrotas.** Anteckningar får **ändras** och **raderas**. |
| 2026-09-04 | **Beslut** | **Journal — öppna/redigera:** **dubbelklick** (dator) eller **långt tryck** (mobil) på en anteckning → redigeringsdialog (text + datum). Hjälptext enligt miljö (`js/platform.js`). |
| 2026-09-04 | **Beslut** | **Journal — radera anteckning:** möjligt från redigeringsdialogen (med bekräftelse). |
| 2026-08-31 | **Beslut** | **Journal — datum:** vid ny eller redigerad anteckning väljer Maria **datum** i kalenderfält (förvalt dagens datum / befintligt datum). |
| 2026-08-30 | **Beslut** | **Journal — sortering:** **nyaste anteckning överst** i listan. |
| 2026-09-04 | **Beslut** | **Journal — visning:** varje anteckning = **fet datumrad** + text (inga tilläggsblock). |

### Huvudvy — layout (från mockup)

Överst: **rullgardin med kunder** (+ Ny kund). Ingen platshållare ”Val av kund…”.

Under: radioknappar **Kundregister** | **Journal** för vald kund.

**Journal:** lista med anteckningar — **nyaste överst**. Dubbelklick / långt tryck öppnar redigering.

### Hälsodeklaration — innehåll (från Marias PDF)

**Kontaktuppgifter på blanketten:** namn, födelsedata, adress, tel. hem, tel. arb, yrke, e-post.

**18 hälsofrågor** (mest Ja/Nej):

1. Hjärt- eller kärlsjukdomar  
2. Blodtryck — högt / lågt / normalt *(stryk under, inte Ja/Nej)*  
3. Svullnader i kroppen  
4. Kramper, stickningar, domningar  
5. Reumatism, ledbesvär, fibromyalgi m.m.  
6. Magbesvär  
7. Astma och allergi  
8. Diabetes  
9. Skelettskador, frakturer  
10. Annan sjukdom (cancer, epilepsi m.m.)  
11. Spiral, protes, pacemaker m.m.  
12. Gravid? *(vilken månad)*  
13. Pågående behandling  
14. Regelbunden medicin *(fritext: sort och för vad)*  
15. Cortisoninjektioner eller tabletter  
16. Förkyld eller feber just nu  
17. Huvudvärk eller migrän *(hur ofta)*  
18. Annat att tillägga  

**Avslutning på pappers-PDF:** kommentarsfält, påstående *”Jag anser mig vara fullt frisk…”*, datum och underskrift.

**I appen (2026-09-05):** frågor + svarsalternativ + kommentar. **Inte** friskhetspåstående/signering. Kontaktfält endast i kundregistret.

**Kontakt på blanketten vs appen:** pappers-PDF:en har kontaktfält upptill. I appen ligger motsvarande uppgifter i **kundregistret** (se beslut ovan) — inte som separat kopia i hälsodeklarationsdelen.

---

## Byggordning (planerad, ej påbörjad)

| Steg | Innehåll | Status |
|------|----------|--------|
| 1 | Firebase Auth + Firestore | **Påbörjad** — Auth **Viktigt**; Firestore `patients` i bruk; `firestore.rules` måste publiceras i Console |
| 2 | Patientlista — skapa och söka patienter | **Påbörjad** — rullgardin, ny kund, radera kund, **Kundregister · XXst** |
| 3 | Kundregister — alla kontaktfält, visa och redigera | **Påbörjad** — Spara/Avbryt, osparade ändringar-varning |
| 4 | Hälsodeklaration — formulär enligt PDF + fil/foto | **Formulär påbörjat 2026-09-05** — visa/fyll i; **saknas:** ersätt, fil, foto |
| 5 | Journal — fritext med datum; redigera/radera; knapp till kundregister | **Påbörjad** — anteckningar, datum, redigera/radera, plattformsanpassad hjälptext |
| 6 | Mobilanpassning | **Påbörjad** — touch/långt tryck; test via Five Server på lokalt nät |
| 7 | Publicering + länk från hemsidan | **Demo-hosting igång 2026-09-05** — se nedan; Marias produktion senare |

---

## Status — vad som är klart / kvar

| Område | Status |
|--------|--------|
| Krav och struktur (tre delar per patient) | **Klart** 2026-08-28 — planering |
| Teknikval (Firebase Spark, webbapp) | **Klart** 2026-08-28 — planering |
| Protokoll | **Klart** 2026-08-28 — denna fil |
| Inloggning (Firebase Auth) | **Viktigt** 2026-09-01 — `Inloggning.html`, `js/auth.js`, `js/login-page.js`; nuvarande UX är målbilden |
| Journalsida + Firestore | **Påbörjad** 2026-09-01 — journal, kundregister, radera kund, osparade ändringar |
| Inställningar (byt lösenord) | **Viktigt** 2026-09-01 — `Inställningar.html`, `js/settings-page.js`; nuvarande UX är målbilden |
| Kod / Firebase-projekt i konsolen | **Pågår** — demo Hosting live; se `firebase-setup.txt` + nedan |
| Resurser (logga, hemsidereferens) | **Klart** 2026-08-28 — `Resurser från hemsidan/` |
| Marias hälsodeklarationsformulär | **Klart** 2026-08-30 — PDF; **app-formulär** 2026-09-05 |
| Layoutmockup huvudvy | **Klart** 2026-08-30 — `Resurser från hemsidan/mall för den stora sidan.png` |
| Demo Firebase Hosting | **Klart 2026-09-05** — projekt `omtankenbokning`, URL `https://omtankenbokning.web.app` (test/nonsensdata; ej Marias produktion) |

### Demo-hosting / deploy (2026-09-05)

- **Live:** `https://omtankenbokning.web.app` (även `/Start.html`, `/Inloggning.html`).
- **Config:** `firebase.json`, `.firebaserc` (default `omtankenbokning`), `index.html` → redirect till `Start.html`.
- **Beslut 2026-09-05:** **Bokning och journal stannar i samma Firebase-projekt** (`omtankenbokning`). Två appar / två hemsidor kan finnas där (t.ex. två Hosting-sites) med **egna datamängder** (`patients` vs `slots`). Inget separat Firebase-projekt för journal just nu — återkom till att städa URL/sites senare om det behövs.
- **Beslut 2026-09-05:** På **inloggningen** väljer Maria **Journal** eller **Bokning**; efter inloggning skickas hon dit. **Bokning** syns men är **dimmad** tills den är inkopplad.
- **Versionsmärkning (enda rutinen):** `js/app-version.js` — **`ååmmdd vxx`**.
  Bumpa **endast vid APK-bygge** (inte under vanlig `npm run dev`).
  Samma dag: höj `APP_VERSION_SEQ`. Ny dag: nytt datum + `SEQ = 1`.
  Spegla `versionName` / `versionCode` i `android/app/build.gradle` vid samma tillfälle.
- **Deploy** (PowerShell, projektmappen):  
  `$env:NODE_OPTIONS="--use-system-ca"` sedan `firebase deploy --only hosting`  
  (SSL-certproblem utan `--use-system-ca` / ev. `NODE_TLS_REJECT_UNAUTHORIZED=0` tillfälligt.)
- **Inloggning CLI:** `rosenborg.thomas@gmail.com`. Cursor-terminal och extern PowerShell kan vara olika sessioner — använd den som lyckats logga in.
- **Ägare i kod (demo):** `JOURNAL_OWNER_EMAIL` = Thomas; `ALLOW_SIGNUP = true`. Vid Maria-överlämning: hennes e-post som ägare, Thomas som reserv, `ALLOW_SIGNUP = false`, rensa test-`patients` eller nytt projekt.
- **Lokala ändringar syns inte live** förrän ny deploy.

---

## Frågor till Maria (ej besvarade)

| Prioritet | Fråga | Varför det spelar roll |
|-----------|-------|------------------------|
| **Hög** | Hur ser **hälsodeklarationen** ut idag? (papper, PDF, egna frågor) | **Besvarad** — PDF uppladdad. |
| **Hög** | När patienten **uppdaterar** hälsotillstånd — byter ni hela blanketten, eller räcker det att hon säger muntligt? | Bekräftar modellen *utbytbar, inte redigerbar*. |
| **Hög** | Ska **gamla versioner** sparas när man byter ut, eller bara den senaste? | Påverkar lagring och GDPR. |
| **Medel** | Behövs **personnummer** eller räcker namn + telefon? | **Besvarad** — personnummer (ååmmdd) valfritt i kundregistret. |
| **Hög** | **Idiotsäkerhet:** Om Maria låser ute sig från sin e-post — vad händer? Är Firebase-kontot och journalerna borta? | **Besvarad 2026-09-04** — data kvar; reservåtkomst + Console. |
| **Medel** | Vilken **e-postadress** ska Marias Firebase-konto använda? | **Vid överlämning** — under utveckling används utvecklarens e-post. |
| **Medel** | Får **journalanteckningar ändras** efteråt, eller bara läggas till nya? | **Besvarad 2026-09-04** — får **ändras och raderas** (Marias modell); tillägg skrotat. |
| **Medel** | Är **foto av pappersblankett** godkänt som “riktig” hälsodeklaration? | Juridiskt/yrkesmässigt, inte bara tekniskt. |
| **Låg** | Behöver hon **skriva ut** eller **exportera** data (backup, flytt)? | Kan vänta, men bra att nämna tidigt. |

*Tidigare fråga om fler terapeuter — ej aktuell (endast Maria).*

---

| Datum | Ämne | Anteckning |
|-------|------|------------|
| 2026-08-31 | **Paus** | Utveckling pausad. Mobiltest (Five Server, brandvägg, Firebase authorized domains) fungerade till slut. |
| 2026-09-01 | **Paus** | Fortsatt kvällsarbete: lösenords-UX (**Viktigt**), journal/kundregister-förbättringar. Paus igen — inget akut trasigt. |
| 2026-09-05 | **Paus** | Demo Hosting live; hälsodeklarationsformulär; inloggningslogga ofärdig. Fortsätt nästa gång — se *Anteckningar vid nästa sammanträde*. |
| 2026-09-12 | **Beslut** | **Firebase-rensning (journal):** all journaldata borttagen från projektet `omtankenbokning` — Firestore `patients` + `settings/access`, Auth-konton för journalinloggning, Hosting-demo ersatt med platshållare. **Bokningen orörd** (`slots`/`days`/`weeks`/`settings/booking`). Firebase-konto/projekt behålls. Fortsatt journalarbete sker lokalt på annat sätt. |
| 2026-09-12 | **Beslut** | **Lokal app:** Capacitor Android **KundAnteckningar** (`se.omtanken.kundanteckningar`). Ikonstart, lösenord (minst 8 tecken) låser upp **SQLCipher**/krypterad SQLite (`@capacitor-community/sqlite`). Ingen journal i molnet. Ingen reservinloggning i appen. Glömt lösenord = radera lokal data. Se `INSTALL-ANDROID.md`. |
| 2026-09-12 | **Beslut** | Ta bort ”ENDAST FÖR TESTNING” och TEST-stämpel. Versionsmärkning: **`ååmmdd vxx`** i `js/app-version.js` (xx = 01–99, därefter om från 01). Start: `260912 v01`. |
| 2026-09-12 | **Beslut** | **Versionsrutin:** endast `ååmmdd vxx` (gamla `ver X` bort). Bumpa **bara när APK ska byggas/skickas**, inte vid varje kodändring. Ny dag → nytt datum + v01. |
| 2026-09-12 | **Beslut** | Kundregister: **Tel. hem** / **Tel. arb** ersätts av ett fält **Mobiltelefon**. |
| 2026-09-13 | **Städning** | Firebase-rester borttagna ur KundAnteckningar-mappen (`firebase.json`, `.firebaserc`, `firestore.rules`, `firebase-setup.txt`, `js/firebase-*`, `js/access.js`). Reservåtkomst-UI borttaget. Bokningsprojektet i Firebase Console orört. |
| 2026-09-13 | **Beslut** | **Backup:** engångsfil `.ka` (AES-GCM). Inställningar → val **Byt lösenord** / **Backup**. Skapa med app-lösenord; återställ ersätter lokal data. Appen sparar **senaste backup-tid**. Användaren flyttar filen själv. |
| 2026-09-16 | **Beslut** | **PWA primär leverans** (som nopEKONOMI): GitHub Pages + service worker. Repo **public** (kod synlig; kunddata krypterad lokalt i webbläsaren). Version bump i `js/app-version.js` + `public/sw.js` CACHE_NAME, sedan push. Android-APK sekundär/reserv. Se `WORKFLOW.md`. Inställningar-fil: `Installningar.html` (ASCII-URL). |
| 2026-08-28 | **Hälsodeklaration — frågeformulär** | **Delvis klart 2026-09-05** — formulär i app; fil/foto/ersätt kvar. |
| 2026-08-28 | **Länk från omtankenhbg.se** | När systemet är färdigt och publicerat. |

---

## Anteckningar vid nästa sammanträde

- **Inloggningslogga** — finjustera storlek/placering (användaren funderar hur hen ska förklara).
- **Hälsodeklaration** — **ersätt** sparad (enligt beslut 2026-08-30); ev. fil/foto senare.
- Maria-överlämning: lösenord / radera lokal data vid behov.
