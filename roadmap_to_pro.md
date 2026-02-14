# Roadmap: Van Prototype naar Professionele Game Platform 🚀

Dit document beschrijft de stappen die nodig zijn om de huidige lokale TypeScript-simulatie om te zetten naar een volledig gehoste, database-gedreven applicatie met accounts, eigen havens en pro-features.

## ✅ Vandaag Voltooid (Foundation)
- **Visuals:** Nieuwe kade, steigers, palen en realistische golfanimatie.
- **Physics:** Kracht-gebaseerd lijnen breken (gekalibreerd op motorvermogen), schroefeffect, windinvloed.
- **UI:** Werkend instellingenmenu, dashboard met windroos, snelheid in knopen.
- **Tutorial:** Interactieve lesmodule met munten en stap-voor-stap instructies.
- **Codebase:** Opgeruimde TypeScript architectuur (GameManager, Render, Physics, Tutorial gescheiden).

---

## 📅 Fase 1: Backend & Database (De "Cloud" Stap)
Om havens op te slaan en te delen, hebben we een backend nodig.

- [ ] **Tech Stack Keuze:** (Bijv. Supabase of Firebase voor snelle start, of Node.js + PostgreSQL).
- [ ] **Database Schema:**
    - `users` (id, email, pro_status)
    - `harbors` (id, user_id, json_data, is_public, high_score)
    - `scores` (id, user_id, harbor_id, time, lines_used)
- [ ] **API Opzetten:** Endpoints voor `saveHarbor`, `loadHarbor`, `getLeaderboard`.

## 🛠 Fase 2: De Haven Editor (Content Creation)
Nu kunnen we alleen JSON bestanden importeren. Een visuele editor is essentieel voor "Pro" features.

- [ ] **Edit Mode UI:** Drag-and-drop interface over het canvas.
- [ ] **Tools:**
    - "Teken Steiger" (klik & sleep).
    - "Plaats Paal/Kikker" (klik).
    - "Definieer Wind" (draai pijl).
- [ ] **Save/Load:** Koppelen aan de nieuwe backend.

## 🎓 Fase 3: Educatie & Classroom (Gamedidactiek Pro)
Functies specifiek voor instructeurs/scholen.

- [ ] **Classroom Mode:** Een docent maakt een haven ("Examen 1") en deelt een code.
- [ ] **Live Spectator:** Docent kan meekijken met leerling (muisbewegingen/bootpositie syncen via WebSockets).
- [ ] **Replay System:** Sla de vaarbewegingen op om later te analyseren ("Kijk, hier ging je te snel achteruit").

## 🌍 Fase 4: Hosting & Polish
- [ ] **Framework Wrapper:** De game (Canvas) inbedden in een React/Vue/Next.js shell voor login-schermen en dashboards.
- [ ] **Deployment:** Automatische deploy via GitHub Actions naar Vercel of Netlify.
- [ ] **Mobile Touch:** Touch controls voor varen op iPad/telefoon.

## 🚀 Directe Volgende Stappen (To Do)
1. **Tech Stack Beslissen:** Kiezen we voor Supabase (eenvoudig, gratis start) of eigen server?
2. **Editor Bouwen:** De editor is de grootste "missing link" nu.
3. **Login Systeem:** Simpele Auth toevoegen.
