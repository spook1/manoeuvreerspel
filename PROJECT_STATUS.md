# Project Roadmap & Sprint Planning 🗺️

> **Laatst bijgewerkt:** 6 Maart 2026 (Avond)
> **Fase:** MVP — Level Builder + Cloud-gebaseerd Standaard Haven systeem

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

### Voltooid in deze sessie

#### 5.1 Multi-Select & Alignment Tools (Haven Editor)
- [x] **Marquee Selection** — sleep een vierkant over objecten om ze in bulk te selecteren
- [x] **Shift+klik** — objecten toevoegen/verwijderen aan selectie
- [x] **Alignment knoppen** (zichtbaar bij 2+ objecten geselecteerd):
  - Links/Rechts/Boven/Onder uitlijnen
  - Horizontaal/Verticaal centreren
  - Gelijkmatig verdelen (horizontaal/verticaal, ≥3 objecten)
- [x] **Undo support** — alle alignment-acties ondersteunen Ctrl+Z

#### 5.2 Z-Order Fix
- [x] **Render volgorde gecorrigeerd**: Water → Quay → **Oevers** → NPCs → **Steigers** → Palen/Kikkers
  - Oevers verschijnen nu *onder* steigers

#### 5.3 Cloud-gebaseerd Standaard Haven Systeem (Architectuur)
- [x] **Alle hardcoded DEFAULT_HARBORS verwijderd** — geen data meer in TypeScript broncode
- [x] **1 lege "Nieuwe Haven" template** als startpunt voor het tekenen van een nieuwe haven
- [x] **Officiële (standaard) havens** zijn nu cloud-gebaseerd via `is_official` vlag in database
- [x] **Publiek API endpoint** `GET /api/harbors/official` — iedereen kan standaardhavens zien, ook zonder login
- [x] **Admin-only bewerking** — alleen admin kan officiële havens bewerken
- [x] **"⭐ Markeer als Standaard" knop** in de haven editor (paars → groen na activering, alleen zichtbaar voor admin)
- [x] **Officiële havens filteren** — verschijnen niet dubbel in "Mijn Havens"
- [x] **User role** globaal beschikbaar via `window._currentUser`
- [x] **Auto-select** na cloud save: dropdown springt automatisch naar de opgeslagen haven
- [x] **Backend uitbreidingen**:
  - `HarborController::official()` — publiek endpoint
  - `HarborController::update()` — admin mag alle havens bewerken + `is_official` toggelen
  - Route: `GET /api/harbors/official` (publiek, geen auth)

#### 5.4 Game Builder Basis (eerder in deze sprint)
- [x] **Game Builder Overlay** UI in `index.html`
- [x] **GameBuilderController.ts** — basis logica
- [x] **Game Selector** in game-modus (keuze: New Game Builder, Tutorial, Start Game)
- [x] **Backend**: Game model, migration, controller, API routes (CRUD)

---

## Sprint 6: Game Builder & Game Loop 🎮 (TODO)
*Doel: Speelbare games samenstellen uit scenario's en de volledige game loop implementeren.*

### TODO
1.  **UC-601: Game Builder Frontend** 🔲
    - [ ] UI voor het selecteren en ordenen van scenario's binnen een game
    - [ ] Drag & drop volgorde
    - [ ] Introtext per scenario instellen
    - [ ] Opslaan naar cloud (`POST /api/games`)
    
2.  **UC-602: Game Loop** 🔲
    - [ ] Speelbare flow: Game selectie → Intro → Scenario 1 → Score → Scenario 2 → ... → Eindscherm
    - [ ] Voortgang bijhouden (welk scenario is voltooid)
    - [ ] Overgang animatie tussen scenario's
    
3.  **UC-603: Scenario Editor Verfijning** 🔲
    - [ ] Delete-knop voor scenario's
    - [ ] "Laden..." indicator bij ophalen cloud-data
    - [ ] Wind/physics correct mee opslaan vanuit de globale instellingen
    
4.  **UC-604: Admin Scenario & Game Systeem** 🔲
    - [ ] Admin kan scenario's markeren als officieel (vergelijkbaar met havens)
    - [ ] Admin kan games markeren als officieel
    - [ ] Publiek endpoint voor officiële scenario's en games

---

## Sprint 7: Polish & Community 💰 (LATER)
*Doel: Community en lanceren klaar maken.*

### TODO
1.  **UC-701: Delen & Spelen** — Linkjes delen van games
2.  **UC-702: Advanced Gameplay** — Ankeren, ondiepten, stroming
3.  **UC-703: Mobile Support** — Touch controls
4.  **UC-704: Leaderboards** — Scores per game/scenario vergelijken
5.  **UC-705: User Profiles** — Voortgang, badges, statistieken

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
| `/api/harbors/{id}` | PUT | ✅ Login/Admin | Haven bijwerken (admin: + is_official) |
| `/api/harbors/{id}` | DELETE | ✅ Login | Haven verwijderen |
| `/api/scenarios` | GET/POST | ✅ Login | Scenario CRUD |
| `/api/games` | GET/POST | ✅ Login | Game CRUD |
| `/api/login` | POST | ❌ Publiek | Inloggen |
| `/api/register` | POST | ❌ Publiek | Registreren |

### Key Files
| Bestand | Verantwoordelijkheid |
|---|---|
| `src/data/harbors.ts` | Types, lege template, dynamische arrays, helper functies |
| `src/core/GameState.ts` | Globale spel-staat (boot, haven, scenario, modus) |
| `src/core/GameManager.ts` | Modus-wisseling, selectors, API integratie, physics |
| `src/core/ApiClient.ts` | Alle API communicatie |
| `src/editor/HarborEditor.ts` | Haven editor (tekenen, selecteren, alignment, cloud save, admin toggle) |
| `src/editor/ScenarioEditorController.ts` | Scenario editor |
| `src/editor/GameBuilderController.ts` | Game builder (basis) |
| `src/ui/Render.ts` | Canvas rendering (water, haven, boot, UI) |
| `backend/app/Http/Controllers/HarborController.php` | Haven API (+ officieel endpoint) |
