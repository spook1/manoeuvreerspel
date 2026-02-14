# Project Status & Nieuw Masterplan 🚀

## 1. Status: Wat is er gedaan van het oude plan?

| Sprint (Oud Plan) | Status | Toelichting |
| :--- | :--- | :--- |
| **1. TS + Vite + Modulair** | ✅ **KLAAR** | Volledige migratie naar TypeScript, Vite en modules (`src/core`, `src/sim`, `src/ui`). |
| **2. GameState + Modes** | 🟡 **DEELS** | `GameState` is gescheiden, physics draait stabiel. `GameManager` beheert modes, maar een strikte "Command API" ontbreekt nog. |
| **3. HarborSpec + Validator** | 🟡 **DEELS** | We hebben datamodellen (`HarborData`), maar nog geen validatie of editor-interface. |
| **4. Backend MVP** | ❌ **NOG NIET** | Geen database of API opgezet. Alles is nog lokaal. |
| **5. Practice vs Play** | ✅ **KLAAR** | Oefenmodus (met sliders) en Game modus (met levels/score) werken. |
| **6. ScenarioSpec** | ❌ **NOG NIET** | Levels zijn nu hardcoded in `GameManager`, geen losse scenario-bestanden. |
| **7-12. Pro Features** | ❌ **NOG NIET** | Accounts, leaderboards, ghosts, analytics ontbreken volledig. |

---

## 2. Feature Map: Free vs Pro (Definitief)

Om de community groot te houden maar waarde te bieden aan betalende gebruikers:

| Feature | **Free User** 🆓 | **Pro User** ⭐ |
| :--- | :--- | :--- |
| **Haven Editor** | ✅ Onbeperkt bouwen | ✅ Onbeperkt bouwen |
| **Publiceren** | ✅ Openbaar & Anoniem | ✅ Optie: "Unlisted" (Privé/Delen via link) |
| **Scenarios Spelen** | ✅ Alle levels + community maps | ✅ Alle levels + community maps |
| **Leaderboards** | 👀 Alleen bekijken | 🏆 **Inzenden** + Plaatsing |
| **Ghosts (Replays)** | 👻 Lokaal opnemen/afspelen | ☁️ **Uploaden** + Downloaden van anderen |
| **Analytics** | ❌ Geen | 📊 **Creator Analytics** (plays, fails, rating) |
| **Cosmetics** | ❌ Standaard boot | 🎨 **Skins, Titleplates & Badges** |

---

## 3. Het Nieuwe Masterplan (Sprintplanning)

We clusteren de oude sprints in logische fases voor de komende tijd.

### 🏗️ Fase 1: De Editor & Content (Sprint 3 & 6)
*Doel: Gebruikers (en wijzelf) kunnen makkelijk nieuwe levels maken zonder code te tikken.*
1.  **Editor UI:** ✅ Drag-and-drop interface bovenop het canvas (Implemented).
    *   *Tools:* Steiger trekken, paal plaatsen, wind instellen, startpositie boot.
2.  **Scenario Formaat:** Definieer JSON structuur voor "Levels" (niet alleen havens, maar ook opdrachten: "Vaar van A naar B zonder botsing").
3.  **Import/Export:** ✅ Lokaal opslaan als `.json` (Implemented: Save) en weer inladen (Partial: Input exists).

### ☁️ Fase 2: Backend Fundering (Sprint 4 & 7)
*Doel: Van lokaal bestand naar "in de cloud".*
1.  **Tech Stack Keuze:** Supabase (aanbevolen voor snelheid/realtime) of Laravel/MySQL (als dat de harde eis is).
2.  **Auth:** Inloggen met Google/Email (nodig voor Pro).
3.  **Database:**
    *   `Users` (Free/Pro vlag).
    *   `Harbors` (JSON data, owner_id).
4.  **API:** Opslaan en laden van havens via unieke ID/Code.

### 🏆 Fase 3: Competitie (Sprint 8 & 9)
*Doel: De game wordt een sport.*
1.  **Leaderboards:** Database tabel `Scores` gekoppeld aan Scenario ID.
2.  **Replay Systeem (Ghosts):**
    *   *Stap 1:* Input recorder in TS (elke frame: throttle, rudder).
    *   *Stap 2:* Opslaan in DB (alleen Pro).
    *   *Stap 3:* Afspelen als "spookboot" over je eigen game heen.

### 📊 Fase 4: Pro Waarde (Sprint 10, 11, 12)
*Doel: Reden geven om Pro te worden.*
1.  **Analytics Dashboard:** Frontend grafiekjes (bv. Chart.js) voor haven-makers.
2.  **Private Harbors:** Vlaggetje in DB `is_listed`.
3.  **Cosmetics:** Simpele texture swap voor de boot (bv. "Gouden Sloop" voor Pro).

---

## 4. Directe Volgende Stappen (Voor Nu)

We zitten nu tussen "Code Cleanup" en "Nieuwe Features". De logische volgende stap is **Fase 1 (De Editor)**, omdat je daarmee de content genereert die straks in de database moet.

**Mijn advies voor de eerstvolgende sessie:**
1.  ✅ **Editor UI** (overlay over canvas) - Voltooid.
2.  ✅ **Import/Export** - Voltooid (JSON bestand).

## 5. Volgende Sessie: De Cloud & Mobiel ☁️📱
Het plan voor morgen:
1.  **VPS Deploy:** De applicatie live zetten op de VPS.
2.  **Backend Integratie:** Koppelen aan een database (Supabase of Laravel).
3.  **Mobiele Versie:** Onderzoeken haalbaarheid en responsive design.
