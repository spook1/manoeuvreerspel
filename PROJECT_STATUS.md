# Project Roadmap & Sprint Planning 🗺️

> **Laatst bijgewerkt:** 20 Maart 2026
> **Fase:** MVP — Game Builder & Game Loop voltooid, nu richting Polish & Community

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

## Sprint 8: UI/UX, QA & Pro Features 🕵️‍♂️ (START HIER)
*Doel: De applicatie visueel stijltrekken, onnodige 'legacy' onderdelen weghalen, functionaliteit server-side testen en het betaalmodel vormgeven.*

### 🛠️ Nieuwe Use Cases (Gepland voor volgende sessies)

#### 1. UC-801: Verwijderen Ingebouwde Oude Games
- [ ] Verwijderen van het legacy `tutorial` en `startgame` (alle havens) systeem uit de "Spel" dropdown.
- [ ] Zorgen dat spelers alléén Game-objecten uit de cloud / API gebruiken en geen hardcoded lokale lijsten meer.

#### 2. UC-802: QA & Server Testing
- [ ] Zorgvuldig alle "edge cases" testen op de live VPS omgeving (login states, cloud connectivity, opslaan).
- [ ] Bugs direct signaleren, isoleren en oplossen tijdens de playtest-fase.

#### 3. UC-803: UI / UX Analyse & Redesign
- [ ] Analyseren of de interface intuïtief genoeg is voor onervaren spelers (UI flow voor Game Selectie vs Oefenen vs Editors).
- [ ] Vormgeving stijltrekken: De hoofdactieknoppen ("Spel" / "Oefenen") onderscheiden van bouw/editor acties ("Haven"/"Scenario"/"Game" bouwen).
- [ ] Toepassen van een cleaner, doordachter design-system.

#### 4. UC-804: Admin Beheerportaal Inzichtelijk Maken
- [ ] Duidelijk in kaart brengen / toegankelijk maken hoe je lokaal (en online) bij het Laravel Admin Panel komt.
- [ ] Beveiligen en stroomlijnen van superadmin features (wie mag standaard havens en games markeren).

#### 5. UC-805: De "Pro" Features 💎
- [ ] Brainstormen en conceptualiseren van functionaliteiten die specifiek achter een betaalmuur of Premium-account vallen (bijv. eigen content maken, toegang tot geavanceerde oefenscenario's).
- [ ] De UI voorbereiden op states waarbij "Pro" functionaliteit vergrendeld is.

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
