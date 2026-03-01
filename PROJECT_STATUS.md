# Project Roadmap & Sprint Planning 🗺️

> **Laatst bijgewerkt:** 1 Maart 2026
> **Fase:** Transitie van POC naar MVP (Full Stack)

---

## Sprint 1: Local Development & Core Stability 🛠️ (✅ AFGEROND)
*Doel: De basis lokaal stabiel en schoon krijgen, zodat we niet op productie hoeven te debuggen.*

### Use Cases
1.  **UC-101: Lokale Testomgeving** ✅
    *   *Actie:* Zorg dat `npm run dev` en `docker compose up` lokaal werken.
    *   *Resultaat:* Developer kan features bouwen zonder internet.
2.  **UC-102: Tutorial Fix** ✅
    *   *Probleem:* Boot vaart door steigers heen in tutorial.
    *   *Actie:* Collision detection aanzetten/checken in tutorial levels.
3.  **UC-103: Visual Bugs** ✅
    *   *Probleem:* Coins drijven in Oefenmodus (moeten weg).
    *   *Actie:* Verberg `CoinEntity` als `GameMode == Practice`.
4.  **UC-104: UI Cleanup** ✅
    *   *Probleem:* Haven Editor tekstveld zichtbaar in Game Modus, dubbele menu's.
    *   *Actie:* UI strakgetrokken, overbodige modals verwijderd, en logische weergave per modus (Game/Oefenen/Editor).

---

## Sprint 2: The Editor 🏗️ (✅ AFGEROND)
*Doel: Content creation mogelijk maken. "Super-Gamemaster" kan levels maken.*

### Use Cases
1.  **UC-201: Editor Enhancements** ✅
    *   *Wens:* Rotaties, Spots (Startposities), Oevers (Shores) en NPC boten plaatsen.
    *   *Implementatie:* `HarborEditor` en renderer geüpdatet zodat alles opgeslagen, geschaald en getekend wordt.
2.  **UC-202: Golden Buoys Logic** ⏳
    *   *Wens:* Boeien met volgorde (1, 2, 3) en levensduur (tijdslimiet).
    *   *Implementatie:* Nieuwe Entity `GoldenBuoy`. Game Loop logic: als `buoy.index == current_target`, dan `score++`.
3.  **UC-203: Level Management** ✅
    *   *Wens:* Meer levels genereren/opslaan.
    *   *Implementatie:* `GameManager` robuust gemaakt met `loadHarborState` om backwards compatibiliteit met oude JSON save files te garanderen.
4.  **UC-204: Super-Gamemaster Mode** ⏳
    *   *Wens:* Admin kan bestaande levels (tutorial/game) aanpassen.
    *   *Implementatie:* Secret keycombo of URL-parameter `?admin=true` om editor te openen in game levels.

---

## Sprint 3: Backend Integration (The "Cloud") ☁️ (✅ AFGEROND)
*Doel: Van lokaal JSON naar Online Database.*

### Use Cases
1.  **UC-301: Authentication (API)** ✅
    *   *Wens:* Spelers kunnen inloggen.
    *   *Actie:* Login & Registratie formulier aangesloten in UI, met JWT/Tokens opgeslagen in localStorage via `ApiClient`.
2.  **UC-302: Save Harbor (API)** ✅
    *   *Wens:* Editor creaties opslaan in cloud.
    *   *Actie:* Havens krijgen unieke database ID's.
3.  **UC-303: Frontend Integration** ✅
    *   *Actie:* `ApiClient.ts` in TypeScript praat vlekkeloos met backend. Opgeslagen havens verschijnen direct in het "Mijn Havens" menuutje met de juiste structuur.

---

## Sprint 4: Scenario & Game Architectuur (Backend First) 🏗️ (NU BEZIG)
*Doel: De gemaakte havens combineren met spelregels (Scenarios) en deze bundelen in speelbare missies (Games).*

### Use Cases & Stappenplan
1.  **UC-401: Backend Database Migraties (Laravel)**
    *   *Tabel `scenarios`:* Opslaan van `harbor_id`, `naam`, `starttekst/uitleg`, en `json_data` (wind, physics, coins, spots met tijden/volgorde, en strafpunten-configuratie per object).
    *   *Tabel `games`:* Opslaan van `naam`, `starttekst_game` (verhaallijn), `startpunten` (bijv. 100), en een gekoppelde lijst van scenario's.
2.  **UC-402: API Endpoints**
    *   *Actie:* Routes en Controllers in Laravel maken voor `/api/scenarios` en `/api/games` (CRUD operaties).
3.  **UC-403: Frontend API Service (`ApiClient.ts`)**
    *   *Actie:* Ophalen en opslaan van Scenario's en Games koppelen aan het internet. Onze tijdelijke `localStorage` oplossingen weggooien.
4.  **UC-404: UI Updates voor The Editors**
    *   *Scenario Editor:* Tekstvakken toevoegen voor The Starttekst en specifieke physics per scenario toevoegen.
    *   *Game Builder (Nieuw):* Een simpel interface om scenario's in een lijstje te slepen/selecteren om een Game te vormen.
5.  **UC-405: De Gameloop (Het Spelen)**
    *   *Actie:* Je kiest een Game -> Toont Game Intro tekst -> Laadt Scenario 1 -> Toont Scenario Missie tekst -> Spelen (met startpunten)! Over naar Scenario 2 etc.

---

## Sprint 5: Monetization & Polish 💰
*Doel: Community en lanceren klaar maken.*

### Use Cases
1.  **UC-501: Delen en Spelen**
    *   *Wens:* Spelers kunnen linkjes delen om een Game/Scenario direct in the browser te openen.
2.  **UC-502: Advanced Gameplay Features**
    *   *Wens:* Ankeren, gevaarlijke ondiepten etc.
3.  **UC-503: Mobile Support**
    *   *Wens:* Ingebouwde touch/mobiel layout om met mobiel te sturen.

---

## Huidige Status (Technical)
*   [x] Frontend Deploy (GitHub Actions -> VPS)
*   [x] Backend Deploy (Docker -> VPS)
*   [x] Database (MySQL -> VPS)
*   [x] API Proxy (DirectAdmin -> Docker)
*   [x] API Endpoints (Laravel Code - Haven CRUD en Auth werken)
*   [x] Frontend <-> Backend Koppeling (`ApiClient.ts` en UI gekoppeld)
