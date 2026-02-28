# Roadmap & Deployment Strategie: Manoeuvreerspel 2.0 🚀

Dit document bevat het complete plan voor de doorontwikkeling van het Manoeuvreerspel, specifiek gericht op community features, admin beheer en professionele deployment.

---

## 🏗️ De Tech Roadmap: Van Prototype naar Platform

We hebben nu de basis (Auth + Cloud Save + Admin Rollen) voltooid. De volgende stap is inhoud en community.

### ✅ Phase 1: Rollen & Rechten (Completed 19/02/2026)
**Status:** ✅ Voltooid.
**Resultaat:**
*   Database heeft `role` kolom.
*   Admin Dashboard via instellingen menu.
*   API endpoints beveiligd (`CheckRole` middleware).

### 🚀 Phase 2: Content Management & Sharing (Next Up)
**Doel:** De game levendig maken door content te delen.

1.  **Openbare Havens:**
    *   Gebruikers kunnen een vinkje "Openbaar" aanzetten bij opslaan (reeds in DB, nu UI).
    *   **Actie:** `HarborController@index` filteren of apart endpoint voor `public` havens.
    *   **UI:** Tabblad "Community Havens" in de Load Modal.

2.  **Officiële Levels (Admin Only):**
    *   Admins kunnen een haven als `is_official` markeren (met gouden ster ⭐).
    *   Deze verschijnen bovenaan of apart ("Officiële Oefeningen").
    *   **UI:** Admin knop in de Load lijst.

3.  **Pro Features:**
    *   Beperk gratis gebruikers tot 3 eigen havens.
    *   Pro mag alles + toegang tot Windkracht 7+.

### 🔮 Phase 3: GameMaster & Multiplayer (Future)
**Doel:** Docenten (GameMasters) controle geven over een klas.

1.  **Game Sessies:**
    *   GameMaster start een "Sessie" (klascode).
    *   Studenten joinen sessie met code.
    *   Live voortgang zien (Dashboard).
2.  **Scenario Push:**
    *   GameMaster kiest haven -> Push naar studenten.

---

## 🚢 Deployment Strategie: "Geen Drama"

Deployment van moderne web apps (Laravel Backend + Vite Frontend) kan lastig zijn op goedkope hosting. Hier zijn de twee beste opties.

### Optie A: De Robuuste Route (Aanbevolen) 🏆
**Tech:** VPS (Virtual Private Server) + Docker.
**Kosten:** ~€5-10/maand (Hetzner, DigitalOcean, Vultr).
**Voordelen:** Identiek aan je development omgeving. Alles werkt altijd. Websockets mogelijk.
**Nadelen:** Je moet Linux commando's durven typen (of Laravel Forge gebruiken).

**Stappenplan:**
1.  Huur een VPS (Ubuntu 22.04).
2.  Installeer Docker & Docker Compose.
3.  Zet de code op de server (via Git).
4.  Maak een `docker-compose.prod.yml` (die Caddy/Nginx gebruikt als reverse proxy en ACME voor https certificaten).
5.  Run `docker compose up -d`.
6.  Klaar. De app regelt zijn eigen SSL en database.

### Optie B: De "Static" Route (Goedkoop/Shared Hosting) 💰
**Tech:** Shared Hosting (Antagonist, TransIP) met PHP ondersteuning.
**Kosten:** Vaak al aanwezig.
**Voordelen:** Geen server beheer.
**Nadelen:** Frontend moet gebouwd worden (`npm run build`), updates zijn handwerk (FTP/Git pull), geen Docker mogelijk.

**Stappenplan:**
1.  **Frontend:** Run `npm run build` lokaal. Dit maakt een `dist` folder.
2.  **Backend:** Upload de `backend` map naar de server (buiten public_html!).
3.  **Deploy:** Kopieer `dist` inhoud naar `public_html`.
4.  **Api:** Configureer `.htaccess` zodat `/api` verzoeken naar Laravel gaan.
5.  **Database:** Exporteer je lokale DB, importeer in phpMyAdmin van host.

### Conclusie & Advies
Ga voor **Optie A** als je serieus bent over GameMaster/Multiplayer features (websockets!).
Ga voor **Optie B** als het puur een static game met save-functie blijft en budget leidend is.
