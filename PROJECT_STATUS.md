# Project Roadmap & Sprint Planning

> **Laatst bijgewerkt:** 2 Mei 2026  
> **Fase:** Beta/MVP+ (core game + cloud editors + admin basis staan)  
> **Globale voortgang:** ongeveer 87%

---

## Status Snapshot (26 April 2026)

### Klaar en werkend
- [x] Core gameplay loop met scenario's en game-reeksen.
- [x] Cloud-first opslag (havens, scenario's, games) met CRUD basis.
- [x] Authenticatie + rollenmodel in gebruik (`speler`, `pro`, `gamemaster`, `super_admin`).
- [x] Adminpanel basis voor gebruikersbeheer (aanmaken, rol wijzigen, bewerken, verwijderen).
- [x] Mobiele besturing vernieuwd:
  - [x] Roer als draaibaar stuurwiel (linksonder).
  - [x] Gashendel vooruit/neutraal/achteruit in 1 verticale lever (rechtsonder).
  - [x] Controls zonder zware kaarten, transparante overlay-stijl voor meer zichtbaar speelveld.
- [x] Speel-HUD met hamburger + centreer-op-boot knop.
- [x] Scenario/Haven editor belangrijke bugs opgelost (o.a. save-crash, standaard-toggle, exit-flow).

### Nog te doen (belangrijkste open punten)
- [ ] **Backend autorisatie aanscherpen**: rechten server-side afdwingen volgens doelmodel (speler: haven, pro: scenario/opname, gamemaster: games/delen, super_admin: alles).
- [ ] **Admin full-management API's** voor alle havens/scenario's/games (nu deels via losse editors en toggles).
- [ ] **Mobiele QA ronde** op echte devices (Android + iOS): ergonomie, touch-gedrag, pinch/zoom regressies, safe-area gedrag.
- [x] **Guest-save funnel**: als niet-ingelogde gebruiker op "Opslaan" klikt, direct register/login-flow tonen en na succesvolle account-aanmaak de save automatisch afronden.
- [ ] **UX polish**:
  - [ ] eenduidige iconset (nu mix van emoji en teksticonen),
  - [ ] duidelijke scheiding "Speler" vs "Makers/Beheer",
  - [ ] afronding copy/taalconsistentie.

### Rolmodel (doelbeeld dat nu grotendeels gevolgd wordt)
| Rol | Spelen/Oefenen | Mag maken | Delen/Publiceren | Beheer |
|---|---|---|---|---|
| `speler` | ja | havens | nee | nee |
| `pro` | ja | scenario's + opnames | beperkt (eigen pro-content) | nee |
| `gamemaster` | ja | games/reeksen | ja (delen met doelgroep) | nee |
| `super_admin` | ja | alles | alles | ja |

---


## Sprint 1: Local Development & Core Stability 🛠️ (✅ AFGEROND)
*Doel: De basis lokaal stabiel en schoon krijgen.*

### Use Cases
1.  **UC-101: Lokale Testomgeving** ✅
2.  **UC-102: Tutorial Fix** ✅
3.  **UC-103: Visual Bugs** ✅
4.  **UC-104: UI Cleanup** ✅

---

## Sprint 2: The Editor 🏗️ (✅ AFGEROND)
*Doel: Content creation mogelijk maken. "Super-Gamemaster" kan levels maken.*

### Use Cases
1.  **UC-201: Editor Enhancements** ✅ — Rotaties, Spots, Oevers, NPC boten
2.  **UC-202: Golden Buoys Logic** ✅ — Boeien met volgorde en tijdslimiet
3.  **UC-203: Level Management** ✅
4.  **UC-204: Object Scaling** ✅ — Resize handles voor steigers en spots

---

## Sprint 3: Backend Integration (The "Cloud") ☁️ (✅ AFGEROND)
*Doel: Van lokaal JSON naar Online Database.*

### Use Cases
1.  **UC-301: Authentication (API)** ✅
2.  **UC-302: Save Harbor (API)** ✅
3.  **UC-303: Frontend Integration** ✅

---

## Sprint 4: Scenario & Cloud Refinement 🏗️ (✅ AFGEROND)
*Doel: Scenarios + Cloud-Only.*

### Voltooid
- [x] Local Storage verwijdering — 100% Cloud First
- [x] Scenario Editor Cleanup — dubbele wind/physics regelaars verwijderd
- [x] Correct Harbor Filtering — scenario's filteren per cloud-haven
- [x] Cloud Prefix Handling — `custom_` prefix voor UI, numerieke ID's voor backend

---

## Sprint 5: Level Builder & Standaard Haven Systeem ⭐ (✅ AFGEROND — 6 Maart 2026)
*Doel: Geavanceerde editor tools + dynamisch standaardhaven-systeem via cloud.*

### Voltooid
- [x] Multi-Select & Alignment Tools (Haven Editor)
- [x] Z-Order Fix (Oevers onder steigers)
- [x] Cloud-gebaseerd Standaard Haven Systeem (`is_official` vlag)
- [x] Admin "⭐ Markeer als Standaard" knop in de Haven Editor
- [x] Backend uitbreidingen: `HarborController::official()`, admin routes
- [x] Live VPS deployment & tests

---

## Sprint 6: Scenario Editor Afmaken ✏️ (✅ AFGEROND — 8 Maart 2026)
*Doel: Scenario Editor volledig werkend krijgen voor intern gebruik.*

### Voltooid in deze sessie

#### 6.1 Bugfixes
- [x] **422-fout bij opslaan scenario** — `official_X` prefix werd letterlijk naar backend gestuurd; nu altijd numerieke DB-ID (`parseInt` na prefix strippen)
- [x] **Verkeerde `harborId` na cloud-load** — `fetchCloudScenarios` gebruikte hard-coded `custom_` prefix; nu op basis van `harbor.is_official` uit de API response

#### 6.2 Scenario Editor UX Verbeteringen
- [x] **"Geen haven geselecteerd" blokkade weggehaald** — Scenario Editor opent direct zonder verplichte havenselectie
- [x] **Haven-selector terug IN de editor** — netjes als aparte rij ónder de scenario-selector
- [x] **Scenario-dropdown toont haven in een 2e kolom** — via monospace padding en `│` scheidingsteken
- [x] **⭐ prefix op standaard scenario's** — zelfde stijl als bij standaard havens
- [x] **Sorteer op haven** — dropdown gesorteerd alfabetisch op havennaam, dan op scenario-naam

#### 6.3 Officiële Scenario's — Admin Systeem
- [x] **Database migratie**: `is_official` kolom toegevoegd aan `scenarios` tabel
- [x] **Publiek API endpoint** `GET /api/scenarios/official` — standaard scenario's voor iedereen
- [x] **Admin toggle**: `POST /api/admin/scenarios/{id}/toggle-official`
- [x] **Admin-only "⭐ Markeer als Standaard" knop** in Scenario Editor (paars → groen na activering)
- [x] **`ApiClient.ts`** uitgebreid met `getOfficialScenarios()` en `toggleOfficialScenario()`
- [x] **`GameManager.ts`** haalt officiële scenario's op bij startup, toont in dropdown

#### 6.4 Per-Object Scenario Instellingen (Coins & Spots)
- [x] **Volgorde (order)** — Munt/spot verschijnt pas als vorige gereed is
- [x] **Tijdslimiet (timeLimit)** — Seconden dat object actief is nadat het verschijnt
- [x] **Lijnen vereist (linesRequired)** — Minimum aanleglijnen voor spot-voltooiing
- [x] **Aanlegtijd (mooringTimeRequired)** — Seconden stil moeten liggen bij spot

#### 6.5 Deployment
- [x] Commit & push naar GitHub (frontend auto-deploy via Actions)
- [x] Backend bestanden geüpload via SCP
- [x] Database migratie uitgevoerd op VPS (`php artisan migrate --force`)
- [x] Cache gecleared op VPS (`php artisan optimize:clear`)

---

## Sprint 7: Game Builder & Game Loop 🎮 (✅ AFGEROND — 20 Maart 2026)
*Doel: Games samenstellen uit scenario's en speelbaar maken als aaneengesloten flow.*

### ✔️ Voltooid in deze sessie (Sessie: Game Builder Polish)
- [x] **Game Builder UI**: Volledig zwevend centraal paneel voor samenstellen van Scenario-reeksen
- [x] **Data structuur & API**: `start_points` en `target_points` toegevoegd in API, Migrations, en Model
- [x] **Unieke Namen & Deduplicatie**: Voorkomen dat eigen games/scenarios identiek zijn of dubbel getoond worden
- [x] **Gecentreerde Editors**: Haven en Scenario editor ook omgebouwd naar een centraal zwevend paneel ("Modal") met behoud van canvas klik-mogelijkheid d.m.v. backdrop blur
- [x] **Verwijderen Opties**: Trash-can button toegevoegd om games weg te gooien, direct naast de titel.
- [x] **Officiële Games**: Standaard games kunnen door admin gemarkeerd worden en in aparte dropdown lijst belanden.

### Voltooid in deze sessie
- [x] **Gameplay Flow**: Volledig werkende overgangen tussen scenario's inclusief uitleg/opdracht per scenario.
- [x] **Data Mapping**: Fix voor het inladen van de juiste API formaten tijdens runtime activering van scenario's.
- [x] **Save Logica Resolutie**: "Opslaan als nieuw" vs "Overschrijven" logica rechtgetrokken voor zowel scenario's als havens.
- [x] **Editor Layouts**: Alle editors consistent gemaakt met correcte weergave/verbergen van de benodigde globale panelen (settings & weergaves).
- [x] **Coin Timers**: Globale animatie context hersteld zodat timers op munten/spots zichtbaar zijn in speelmodus.

#### 7.1 Game Builder Verdere Verfijning (UC-701 vervolg)
- [x] In de Game Editor een selector inbouwen om te kiezen welke game je wilt bewerken, óf een knop om een Nieuwe Game te maken.
- [x] Bij opslaan van game met zelfde naam: i.p.v. blokkade vragen "Je hebt al een game met deze naam, weet je zeker dat je deze wilt overschrijven?"
- [x] Look en feel van de Game Editor visueel verder aanpassen zodat deze precies overeenkomt met de layout van de andere twee editors.

#### 7.2 Game Loop (UC-702) (Hierna oppakken)
- [x] Game spelen gaan oppakken en de scenario reeks correct doorlopen (`GameRunner`).
- [x] Speelbare flow: Game selectie → Intro → Scenario 1 → ... → Eindscherm
- [x] Scenario-specifieke `start_points` overerven of aftrekken gedurende de runtime
- [x] Validatie tegen `target_points` (is doel gehaald bij einde scenario reeks?)
- [x] UI: Dashboard updaten om punten / voortgang te tonen tijdens de Game Mode
- [x] Overgangsanimatie of "Next Level" tussenscreen tussen scenarios in een reeks

#### 7.4 Kleine Openstaande Verbeteringen
- [x] Delete-knop voor scenario's in Scenario Editor (via linker paneel indien nodig)
- [x] "Laden..." indicator bij ophalen cloud-data
- [x] Scenario Editor: havennaam in de editor header tonen zodra scenario geladen is

---

## Sprint 8: Mobiele Support, UI/UX, QA & Pro Features (IN BEHANDELING)
*Doel: De applicatie visueel stijltrekken, speelbaar maken op mobiele apparaten (Touch Controls), functionaliteit server-side testen en het betaalmodel vormgeven.*

### Voltooid in de meest recente sessie
- [x] **CRUD Logica Gefixt**: De knoppen voor 'Cloud Opslaan' in álle editors zijn samengevoegd tot één krachtige **"💾 Opslaan"** knop met slimme overschrijf- / nieuw-logica op basis van exacte naam (en unieke bevestigings-prompt) om dubbele records te voorkomen.
- [x] **Admin Rechten (Backend & UI)**: De `destroy`, `update` en `show` logica is 100% cloud-based en Admin-proof gemaakt met de juiste rolverificaties.
- [x] **UC-801: Verwijderen Ingebouwde Oude Games**: Alle hardcoded 'Tutorial' en 'Startgame' mock-ups zijn volledig verwijderd. De database is nu leidend.
- [x] **Draggable Editors**: De panelen van de Haven, Scenario en Game Builder editors zijn nu zwevend en versleepbaar gemaakt via een globale `makeDraggable` helper.
- [x] **Gastvriendelijke Haveneditor**: niet-ingelogde gebruikers mogen de haveneditor openen; opslaan leidt naar login/registratie en rondt daarna de save af.
- [x] **Anchor-Based Resizing**: De resize-hendels in de editor behouden nu feilloos hun verankerde X/Y positie aan de tegenovergestelde zijde.

### 🛠️ Nieuwe Use Cases (Gepland voor volgende sessies)

#### 1. UC-802: QA & Server Testing (Prioriteit 1)
- [ ] Zorgvuldig alle "edge cases" testen (cloud connectivity, gameloop uitspelen via VPS, foutief wachtwoord login states).
- [ ] Spelend testen vanaf de *gebruikerskant*: zijn er stappen in de game-loop die vastlopen?

#### 2. UC-803: UI / UX Professionaliseringsslag (Prioriteit 1)
Op basis van een uitgebreide analyse wordt de interface aanzienlijk geprofessionaliseerd (weg van prototype/hobby-look):
- [x] **A. Game/Oefen HUD:** 'Cards' vervangen door een moderne, minimalistische transparante HUD die in beide modi consistent werkt.
- [ ] **B. Visuele Identiteit:** Emojis (🎮, ⚓, 🎬) vervangen door een strakke, consistente iconenset (bijv. FontAwesome, Material of custom SVG's).
- [ ] **C. Scheiding Spelers/Makers:** Duidelijke hiërarchie. Hoofdmenu toont enkel "Speel" en "Oefen". Editors/Admin-tools verhuizen naar een afgeschermd "Creators" menu.
- [ ] **D. Formulier & UI Overzicht:** Geavanceerde tools groeperen in accordeon-menu's (bijv. in-/uitklapbare "Geavanceerde Fysica") in plaats van alles te tonen.
- [ ] **E. Modals & Onboarding:** Consistente modale vensters met duidelijke kleuren.
- [ ] **F. Vaktermen & Consistentie:** Interface 100% eentalig (Nederlands) en nautische vaktermen consequent doorvoeren.

#### 4. UC-804: Admin Beheerportaal Inzichtelijk Maken (✅ AFGEROND)
- [x] Admin Panel frontend UI gebouwd (`AdminPanel.ts`) met tabbladen voor Gebruikers, Havens, Scenario's en Games.
- [x] Backend integratie via `AdminController` en API routes (waaronder rollen aanpassen en tellen van havens/scenario's).
- [x] "Nieuwe Gebruiker Aanmaken" formulier toegevoegd in Admin Panel.
- [x] Database enum `role` aangepast naar: `user`, `speler`, `pro`, `gamemaster`, `admin` (ter vervanging van `student`).
- [x] "⚙️ Admin" knop in de navigatiebalk alleen zichtbaar gemaakt voor ingelogde admins.

#### 5. UC-805: De "Pro" Features 💎
- [ ] **Pakketdefinitie uitwerken**:
  - [ ] `Speler`: haven maken en lokaal/oefen gebruiken.
  - [ ] `Pro`: scenario's maken, acties/sessies opnemen, eigen content delen.
  - [ ] `Gamemaster`: games/reeksen bouwen en gericht delen/publiceren.
- [ ] **Betaalmodule ontwerpen**:
  - [ ] abonnementsniveaus en entitlement-checks (frontend + backend),
  - [ ] betaalprovider-keuze (bijv. Stripe/Mollie), webhook-flow en facturatie basis,
  - [ ] upgrade/downgrade UX in accountomgeving.
- [ ] **UI-lock states**: vergrendelde Pro/Gamemaster functies met duidelijke upgrade-flow.
- [ ] **Content sharing roadmap**:
  - [ ] opnames exporteren en delen (Pro),
  - [ ] games publiceren en delen (Gamemaster),
  - [ ] optie "Havenmeester Academy": instructievideo's over haven-gedrag los van game-scenario's.

#### 6. UC-806: Mobiele Controls & Camera (doorlopend verbeterd)
- [x] **Fase 1**: Action Layer Architectuur (`InputState` ipv hardcoded keys in de gameloop).
- [x] **Fase 2**: Touch UI Overlay ontwikkeld (4-button helm + stopknop) via `TouchUI.ts`. Weergave reageert autonoom op Touch-devices. Buttons horizontaal geplaatst ("Meer Gas", "Geen Gas", "Minder Gas").
- [x] **Camera Systeem**: `Camera.ts` toegevoegd inclusief **Strict Bounds Panning** en **Handmatige Pinch-Zoom**. Inclusief 🎯 Focus Knop & 'C' shortcut.
- [x] **Vastlopend Roer & URL Balk Fix**: State-machine van touch/keyboard volledig gescheiden ter voorkoming van hangend roer. CSS PWA `manifest.json` en `100dvh` geïmplementeerd om navigatiebalken van mobile browsers permanent te verbergen.
- [x] **Nieuwe mobiele controls**: roerslider vervangen door draaibaar stuurwiel; gashendel naar compacte kaartloze overlay.

#### 7. UC-807: Interface Optimalisatie & Top Bar Overhaul (IN BEHANDELING)
*Doel: Professionele, nautische HUD met intuïtieve mobiele besturing.*

- [x] **A. Action Layer Architectuur**: `InputManager` uitgebreid met `touchRudderOverride` en `touchThrottleOverride`.
- [x] **B. Touch UI Redesign**: Nieuwe roerslider (-75° snap-to-center) en verticale gashendel (V/N/A + slider).
- [x] **C. HUD Layout Overhaul**: Hamburgermenu, Digitaal Kompas en Telemetrie-kaarten geïmplementeerd.
- [x] **D. Visuele Identiteit**: Semi-transparante nautische styling met blur-effecten.
- [x] **E. Render Engine Sync**: `Render.ts` hersteld en gesynchroniseerd met nieuwe HUD-data.
- [x] **F. Verdere mobile cleanup**: kaartloze stuurwiel/throttle controls en extra center-knop in play HUD.
- [ ] **G. QA & Ergonomie**: Testen en fine-tuning op mobiel.

#### 8. UC-808: Code Audit & Security Check (Gepland) 🔒
- [ ] Grondige check op legacys code, ongebruikte componenten of dode variabelen.
- [ ] Security check: Controle op eventuele hardcoded passwords of test-credentials in backend en frontend omgevingen.
- [ ] Architectuur-schoonmaak van redundante methodes in classes.

#### 9. UC-809: Instellingen in Oefenmodus & Scenario Physics in Game (Nieuw — 2 Mei 2026) ⚙️

**Huidige situatie (uit broncode):**
- `ScenarioData` heeft al een `physics?: ScenarioPhysics` veld met: `mass`, `dragCoeff`, `lateralDragCoeff`, `thrustGain`, `rudderWashGain`, `rudderHydroGain`, `lineStrength`, `propDirection`.
- Bij `startScenario()` in `GameManager.ts` (regel 379) wordt `applyScenarioPhysics()` al aangeroepen — **de scenario physics worden dus al toegepast bij het spelen van een game ✅**.
- Wind-sliders in de settingspaneel schrijven al naar `harbor.wind` (oefenmodus) of `scenario.wind` (scenario-edit).
- **Probleem 1:** In oefenmodus zijn de physics-sliders (`massSlider`, `dragSlider`, etc.) aanwezig maar **verborgen achter een settingsknop** en **niet gelinkt aan het actieve scenario** — de speler kan ze niet intuitiï instellen vóór het oefenen.
- **Probleem 2:** Na het spelen van een game worden de `Constants` overschreven door het scenario en **niet teruggezet** naar standaardwaarden tenzij er een ander scenario geladen wordt — dit kan leiden tot verkeerde physics als je na een game gaat oefenen.

**Te doen:**
- [x] **A. Oefen-startscherm**: Een modal of apart paneel tonen bij het selecteren van "Oefen" waarmee de speler wind, windrichting, en belangrijkste physics (massa, stuwkracht) kan instellen vóór de sessie. Bestaande sliders hergebruiken of dupliceren in dit scherm.
- [x] **B. Constants.reset() aanroepen** bij terugkeren naar oefenmodus na een game (`startPracticeMode()`), zodat scenario-physics niet blijven hangen.
- [x] **C. Verificatie**: Controleren of bij spelen van een game via `GameRunner` de scenario physics ook correct meegegeven worden (zie `GameRunner.ts` r. 58 — `physics: raw.json_data?.physics`).
- [x] **D. Laatste instellingen onthouden** voor volgende oefen-sessie (localStorage).

#### 10. UC-810: Slimme Auto-Zoom Camera (Nieuw — 2 Mei 2026) 🎥
*Wens: bij start van een game/scenario is de volledige haven zichtbaar; daarna zoomt de camera in op basis van de snelheid van de boot (langzaam = ver ingezoomd, snel = meer uitgezoomd). Pinch-to-zoom overschrijft de auto-zoom; een klik op de Focus-knop herstelt de auto-zoom.*
- [ ] **A.** Bij start haven volledig in beeld brengen (`fitToHarbor()` — min/max bounds van alle objecten berekenen).
- [ ] **B.** Auto-zoom loop in `Camera.ts`: doelzoom berekenen op basis van `ship.speed` (bijv. `targetZoom = BASE - speed * FACTOR` met min/max clamp).
- [ ] **C.** Smooth interpolatie naar doelzoom (lerp) zodat de zoom niet schokkerig is.
- [ ] **D.** Vlag `autoZoomActive: boolean` in Camera — pinch zet deze op `false`.
- [ ] **E.** Focus-knop (🎯) zet `autoZoomActive` terug op `true` én centreert op de boot (net als huidige recenter-functie, maar met zoom-reset).
- [ ] **F.** QA: snap-to-bounds voorkomen dat camera buiten havengrenzen zoemt.

#### 11. UC-811: Mobiele Editor — Touch Input & Volledig Scherm (Nieuw — 2 Mei 2026) 📱
*Wens: in de Haven Editor op mobiel werken steigers/oevers tekenen en rechthoek-selectie niet goed door touch-conflicten. Daarnaast moet de editor in volledig scherm kunnen werken met een verbergbaar menu.*

**A. Touch-teken conflicten oplossen:**
- [x] Onderscheid maken tussen 1-vinger pan/navigatie en 1-vinger tekenen (bijv. via expliciete "Teken-modus" toggle in de toolbar).
- [x] Rechthoek-selectie werkend maken via touch: `touchstart` → `touchmove` → `touchend` zonder conflicten met scroll/pan.
- [x] Steiger/oever-tekenen: multi-point touch-pad conflicten oplossen door canvas `touch-action: none` te forceren in editor-modus.

**B. Volledig scherm editor op mobiel:**
- [x] Tijdens tekenen de editor-toolbar/menu automatisch verbergen (fade-out na 2 seconden inactiviteit of handmatig minimaliseren).
- [x] Verborgen menu terughalen via een zwevend **✏️ potloodknop** (altijd zichtbaar op de rand van het scherm).
- [x] Fullscreen-knop in de editor toolbar om de browser-balk te verbergen (`document.documentElement.requestFullscreen()`).

**C. Navigatie op mobiel:**
- [x] **Hamburger-menu** in de Haven Editor (mobiel) met een "← Terug naar startscherm" optie, zodat de gebruiker niet vast zit in de editor.
- [x] Dezelfde terugknop toevoegen aan de Scenario Editor (mobiel).

**Prioriteit:** Hoog — blokkeert normaal gebruik van de editors op mobiel.

---

## Sprint 9: Polish & Community 💰 (LATER)
*Doel: Community en lanceren klaar maken.*

### TODO
1.  **UC-901: Delen & Spelen** — Linkjes delen van games
2.  **UC-902: Advanced Gameplay** — Ankeren, ondiepten, stroming
3.  **UC-903: Mobile Support** — Touch controls
4.  **UC-904: Leaderboards** — Scores per game/scenario vergelijken
5.  **UC-905: User Profiles** — Voortgang, badges, statistieken

---

## Huidige Architectuur (Technical)

### Infrastructuur
- [x] Frontend Deploy (GitHub Actions → VPS)
- [x] Backend Deploy (Docker → VPS)
- [x] Database (MySQL → VPS)
- [x] API Proxy (DirectAdmin → Docker)

### API Endpoints
| Endpoint | Methode | Auth | Beschrijving |
|---|---|---|---|
| `/api/harbors/official` | GET | ❌ Publiek | Alle officiële havens |
| `/api/harbors` | GET | ✅ Login | Eigen + officiële havens |
| `/api/harbors` | POST | ✅ Login | Haven opslaan |
| `/api/harbors/{id}` | PUT | ✅ Login/Admin | Haven bijwerken |
| `/api/harbors/{id}` | DELETE | ✅ Login | Haven verwijderen |
| `/api/admin/harbors/{id}/toggle-official` | POST | ✅ Admin | Officieel toggle haven |
| `/api/scenarios/official` | GET | ❌ Publiek | Alle officiële scenario's |
| `/api/scenarios` | GET/POST | ✅ Login | Scenario CRUD |
| `/api/scenarios/{id}` | PUT/DELETE | ✅ Login | Scenario bijwerken/verwijderen |
| `/api/admin/scenarios/{id}/toggle-official` | POST | ✅ Admin | Officieel toggle scenario |
| `/api/games` | GET/POST | ✅ Login | Game CRUD |
| `/api/games/{id}` | PUT/DELETE | ✅ Login | Game bijwerken/verwijderen |
| `/api/login` | POST | ❌ Publiek | Inloggen |
| `/api/register` | POST | ❌ Publiek | Registreren |

### Key Files
| Bestand | Verantwoordelijkheid |
|---|---|
| `src/data/harbors.ts` | Types, lege template, dynamische arrays, helper functies |
| `src/core/GameState.ts` | Globale spel-staat (boot, haven, scenario, modus) |
| `src/core/GameManager.ts` | Modus-wisseling, selectors, API integratie, game loop |
| `src/core/ApiClient.ts` | Alle API communicatie |
| `src/core/ScenarioRunner.ts` | Scenario gameplay logica (coins, spots, timer) |
| `src/editor/HarborEditor.ts` | Haven editor (tekenen, alignment, cloud save, admin toggle) |
| `src/editor/ScenarioEditorController.ts` | Scenario editor (coins, spots, opslaan, admin toggle) |
| `src/editor/GameBuilderController.ts` | Game builder (basis aanwezig, nog verder te bouwen) |
| `src/ui/Render.ts` | Canvas rendering (water, haven, boot, UI) |
| `backend/app/Http/Controllers/HarborController.php` | Haven API |
| `backend/app/Http/Controllers/ScenarioController.php` | Scenario API (+ officieel endpoint) |
| `backend/app/Http/Controllers/AdminController.php` | Admin: toggle official haven/scenario |
| `backend/app/Http/Controllers/GameController.php` | Game API |
