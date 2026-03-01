# Project Roadmap & Sprint Planning 🗺️

> **Laatst bijgewerkt:** 1 Maart 2026 (Avond)
> **Fase:** Transitie van POC naar MVP (Full Stack)

---

## Sprint 1: Local Development & Core Stability 🛠️ (✅ AFGEROND)
*Doel: De basis lokaal stabiel en schoon krijgen, zodat we niet op productie hoeven te debuggen.*

### Use Cases
1.  **UC-101: Lokale Testomgeving** ✅
    *   *Actie:* Zorg dat `npm run dev` en `docker compose up` lokaal werken.
2.  **UC-102: Tutorial Fix** ✅
    *   *Probleem:* Boot vaart door steigers heen in tutorial.
3.  **UC-103: Visual Bugs** ✅
    *   *Probleem:* Coins drijven in Oefenmodus (moeten weg).
4.  **UC-104: UI Cleanup** ✅
    *   *Actie:* UI strakgetrokken, overbodige modals verwijderd, en logische weergave per modus (Game/Oefenen/Editor).

---

## Sprint 2: The Editor 🏗️ (✅ AFGEROND)
*Doel: Content creation mogelijk maken. "Super-Gamemaster" kan levels maken.*

### Use Cases
1.  **UC-201: Editor Enhancements** ✅
    *   *Wens:* Rotaties, Spots (Startposities), Oevers (Shores) en NPC boten plaatsen.
2.  **UC-202: Golden Buoys Logic** ⏳
    *   *Wens:* Boeien met volgorde (1, 2, 3) en levensduur (tijdslimiet).
3.  **UC-203: Level Management** ✅
    *   *Wens:* Meer levels genereren/opslaan.
4.  **UC-204: Super-Gamemaster Mode** ⏳
    *   *Wens:* Admin kan bestaande levels (tutorial/game) aanpassen.

---

## Sprint 3: Backend Integration (The "Cloud") ☁️ (✅ AFGEROND)
*Doel: Van lokaal JSON naar Online Database.*

### Use Cases
1.  **UC-301: Authentication (API)** ✅
    *   *Wens:* Spelers kunnen inloggen.
2.  **UC-302: Save Harbor (API)** ✅
    *   *Wens:* Editor creaties opslaan in cloud.
3.  **UC-303: Frontend Integration** ✅
    *   *Actie:* `ApiClient.ts` in TypeScript praat vlekkeloos met backend. Opgeslagen havens verschijnen direct in het "Mijn Havens" menuutje.

---

## Sprint 4: Scenario & Cloud Refinement 🏗️ (NU BEZIG)
*Doel: De gemaakte havens combineren met spelregels (Scenarios) en alles volledig naar de cloud.*

### Voltooid in deze sessie (UC-406):
*   [x] **Local Storage Verwijdering**: Alle lokale fallback mechanismen (`localStorage`, `hbrFileInput`) zijn verwijderd. Het spel is nu 100% "Cloud First".
*   [x] **Scenario Editor Cleanup**: Dubbele wind/physics regelaars in het scenario-editor panel zijn verwijderd. De editor gebruikt nu de actuele globale instellingen (via het tandwiel-menu).
*   [x] **Correct Harbor Filtering**: Wanneer je in de Scenario Editor van haven wisselt, verschijnt direct de lijst met scenario's die specifiek bij die cloud-haven horen.
*   [x] **Cloud Prefix Handling**: Integratie van `custom_` prefix voor UI consistentie, terwijl de backend de schone numerieke ID's blijft ontvangen.

### Volgende Stappen:
1.  **UC-407: Validatie & User Testing**:
    *   *Test:* Haven maken -> Scenario toevoegen -> Spelen -> Check of Wind/Physics correct uit de algemene instellingen zijn meegekomen.
    *   *Error Handling:* UI feedback toevoegen voor als de API offline is.
2.  **UC-408: Scenario Editor Verfijning**:
    *   *Feature:* Delete-knop voor scenario's implementeren.
    *   *UX:* Indicator toevoegen ("Laden...") bij het ophalen van cloud-data.
3.  **UC-409: Game Builder (Nieuw)**:
    *   *Actie:* Een interface bouwen om meerdere scenario's achter elkaar te plakken tot een speelbare "Game".
4.  **UC-410: De Gameloop**:
    *   *Actie:* Speelbare flow maken: Game Selectie -> Intro -> Scenario 1 -> Volgende etc.

---

## Sprint 5: Monetization & Polish 💰
*Doel: Community en lanceren klaar maken.*

### Use Cases
1.  **UC-501: Delen en Spelen** (Linkjes delen)
2.  **UC-502: Advanced Gameplay** (Ankeren, ondiepten)
3.  **UC-503: Mobile Support** (Touch controls)

---

## Huidige Status (Technical)
*   [x] Frontend Deploy (GitHub Actions -> VPS)
*   [x] Backend Deploy (Docker -> VPS)
*   [x] Database (MySQL -> VPS)
*   [x] API Proxy (DirectAdmin -> Docker)
*   [x] API Endpoints (Haven & Scenario CRUD en Auth werken)
*   [x] Frontend <-> Backend Koppeling (Volledig Cloud-Only nu)
