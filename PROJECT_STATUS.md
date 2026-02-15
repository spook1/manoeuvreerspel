# Project Roadmap & Sprint Planning 🗺️

> **Laatst bijgewerkt:** 15 Februari 2026
> **Fase:** Transitie van POC naar MVP (Full Stack)

---

## Sprint 1: Local Development & Core Stability 🛠️
*Doel: De basis lokaal stabiel en schoon krijgen, zodat we niet op productie hoeven te debuggen.*

### Use Cases
1.  **UC-101: Lokale Testomgeving**
    *   *Actie:* Zorg dat `npm run dev` en `docker compose up` lokaal werken.
    *   *Resultaat:* Developer kan features bouwen zonder internet.
2.  **UC-102: Tutorial Fix**
    *   *Probleem:* Boot vaart door steigers heen in tutorial.
    *   *Actie:* Collision detection aanzetten/checken in tutorial levels.
3.  **UC-103: Visual Bugs**
    *   *Probleem:* Coins drijven in Oefenmodus (moeten weg).
    *   *Actie:* Verberg `CoinEntity` als `GameMode == Practice`.
4.  **UC-104: UI Cleanup**
    *   *Probleem:* Haven Editor tekstveld zichtbaar in Game Modus.
    *   *Actie:* CSS class `hidden` conditioneel toepassen op editor UI nodes.

---

## Sprint 2: The Editor 🏗️
*Doel: Content creation mogelijk maken. "Super-Gamemaster" kan levels maken.*

### Use Cases
1.  **UC-201: Editor Enhancements**
    *   *Wens:* Rotaties, Spots (Startposities), en Gouden Boeien plaatsen.
    *   *Implementatie:* `EditorUI` uitbreiden met knoppen. `HarborData` JSON schema updaten.
2.  **UC-202: Golden Buoys Logic**
    *   *Wens:* Boeien met volgorde (1, 2, 3) en levensduur (tijdslimiet).
    *   *Implementatie:* Nieuwe Entity `GoldenBuoy`. Game Loop logic: als `buoy.index == current_target`, dan `score++`.
3.  **UC-203: Level Management**
    *   *Wens:* Meer levels genereren/opslaan.
    *   *Implementatie:* Lokaal JSON export/import verbeteren.
4.  **UC-204: Super-Gamemaster Mode**
    *   *Wens:* Admin kan bestaande levels (tutorial/game) aanpassen.
    *   *Implementatie:* Secret keycombo of URL-parameter `?admin=true` om editor te openen in game levels.

---

## Sprint 3: Backend Integration (The "Cloud") ☁️
*Doel: Van lokaal JSON naar Online Database.*

### Use Cases
1.  **UC-301: Authentication (API)**
    *   *Wens:* Spelers kunnen inloggen.
    *   *Actie:* Laravel Sanctum/Fortify installeren. Endpoints `/login`, `/register`.
2.  **UC-302: Save Harbor (API)**
    *   *Wens:* Editor creaties opslaan in cloud.
    *   *Actie:* `POST /api/harbors` endpoint maken in Laravel. `Harbor` Model koppelen aan `User`.
3.  **UC-303: Frontend Integration**
    *   *Actie:* `ApiClient.ts` in TypeScript maken die praat met `/api/...`.
    *   *Resultaat:* "Opslaan" knop in editor stuurt data naar MySQL.

---

## Sprint 4: Advanced Gameplay (Pro Features) ⭐
*Doel: Diepgang toevoegen voor ervaren spelers.*

### Use Cases
1.  **UC-401: Anchoring (Pro)**
    *   *Wens:* Boot kan anker uitgooien.
    *   *Implementatie:* Physics aanpassing (extra drag/force op punt). UI knop "Anker".
    *   *Pro Check:* Alleen als `user.is_pro == true`.
2.  **UC-402: Environmental Hazards**
    *   *Wens:* Ondieptes en Rotsoever.
    *   *Implementatie:* Nieuwe `Zone` types in Physics engine. `ShallowZone` (hogere drag), `RockZone` (direct damage/fail).

---

## Sprint 5: Monetization & Social 💰
*Doel: Community en Verdienmodel.*

### Use Cases
1.  **UC-501: Sharing**
    *   *Wens:* Spelers kunnen havens delen.
    *   *Implementatie:* Unieke URL `manoeuvreerspel.nl/play/{harbor_id}`.
    *   *Pro Check:* Alleen betalende leden mogen 'public' havens maken.
2.  **UC-502: Admin Dashboard**
    *   *Wens:* Admin kan features aan/uit zetten.
    *   *Implementatie:* Simpel Laravel Filament dashboard of tabelbeheer.
3.  **UC-503: Mobile Support**
    *   *Wens:* Speelbaar op telefoon.
    *   *Implementatie:* Virtual Joystick op screen (ipv keyboard). CSS media queries.

---

## Huidige Status (Technical)
*   [x] Frontend Deploy (GitHub Actions -> VPS)
*   [x] Backend Deploy (Docker -> VPS)
*   [x] Database (MySQL -> VPS)
*   [x] API Proxy (DirectAdmin -> Docker)
*   [ ] API Endpoints (Laravel Code)
*   [ ] Frontend <-> Backend Koppeling
