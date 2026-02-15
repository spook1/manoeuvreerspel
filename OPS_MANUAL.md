# Operations Manual & Handover - Manoeuvreerspel

> **Laatst bijgewerkt:** 14 Februari 2026
> **Project:** Manoeuvreerspel (TypeScript + Laravel/Docker)
> **Locatie:** `manoeuvreerspel.netwerkspel.nl`

---

## 1. Architectuur Overzicht

Het systeem bestaat uit twee delen die samenwerken via een Reverse Proxy:

1.  **Frontend (Web):**
    *   **Tech:** TypeScript, Vite, PixiJS.
    *   **Locatie:** `/home/admin/domains/manoeuvreerspel.netwerkspel.nl/public_html`
    *   **URL:** `https://manoeuvreerspel.netwerkspel.nl`
    *   **Deploy:** Automatisch via GitHub Actions (rsync).

2.  **Backend (API):**
    *   **Tech:** Laravel 11, PHP 8.4, Nginx, Docker Compose.
    *   **Locatie:** `/home/admin/domains/manoeuvreerspel.netwerkspel.nl/backend`
    *   **URL:** `https://manoeuvreerspel.netwerkspel.nl/api`
    *   **Deploy:** Handmatig (git pull + docker compose build/up) op de server.

## 2. Server & Toegang

*   **Host:** `netwerkspel.nl` (185.224.89.206)
*   **SSH User:** `admin` (Eigenaar bestanden) / `root` (Voor Docker commando's)
*   **SSH Key:** `deploy_key` (Lokaal in projectmap).
    *   Inloggen: `ssh -i deploy_key admin@netwerkspel.nl`

## 3. Configuraties & Wachtwoorden

### Database (MySQL DirectAdmin)
Deze database wordt gebruikt door de Laravel backend.
*   **Database:** `admin_manoeuvreerspel`
*   **User:** `admin_manoeuvreerspel`
*   **Password:** `U83UAG25YUsv2axRrt28`
*   **Host:** `172.17.0.1` (Docker Host Gateway) of `host.docker.internal`

### Laravel Backend (.env)
Locatie: `/home/admin/domains/manoeuvreerspel.netwerkspel.nl/backend/.env`
Belangrijke keys:
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://manoeuvreerspel.netwerkspel.nl

DB_CONNECTION=mysql
DB_HOST=host.docker.internal
DB_PORT=3306
DB_DATABASE=admin_manoeuvreerspel
DB_USERNAME=admin_manoeuvreerspel
DB_PASSWORD=U83UAG25YUsv2axRrt28
```

### GitHub Secrets
Ingesteld in repository `Settings -> Secrets -> Actions`:
*   `HOST`: `netwerkspel.nl`
*   `USERNAME`: `admin`
*   `REMOTE_DIR`: `/home/admin/domains/manoeuvreerspel.netwerkspel.nl/public_html/`
*   `SSH_PRIVATE_KEY`: *(Inhoud van deploy_key bestand)*

## 4. Deployment Procedures

### Frontend Deploy (Automatisch)
1.  Commit & Push naar `master`.
2.  GitHub Action `Deploy to Versio VPS` gaat draaien.
3.  Bouwt de app (`npm run build`) en uploadt de `dist/` map naar `public_html`.

### Backend Deploy (Semi-Automatisch)
Omdat de backend in Docker draait, moet deze soms herbouwd worden (bijv. nieuwe dependencies of PHP instellingen).

1.  **Lokaal:** Commit & Push wijzigingen in `backend/` map.
2.  **Server (SSH als root):**
    ```bash
    cd /home/admin/domains/manoeuvreerspel.netwerkspel.nl/backend
    
    # Code updaten (als je git hebt ingesteld, anders scp)
    # OF handmatig uploaden via SCP als git moeilijk doet:
    # scp -r -i deploy_key backend/* admin@netwerkspel.nl:.../backend/
    
    # 1. Herbouwen (nodig bij wijziging Dockerfile)
    docker compose build --no-cache app
    
    # 2. Herstarten
    docker compose up -d
    
    # 3. Cache legen (altijd goed na update)
    docker compose exec app php artisan optimize:clear
    ```

## 5. Directory Structuur op Server

```text
/home/admin/domains/manoeuvreerspel.netwerkspel.nl/
├── public_html/          <-- Frontend bestanden (index.html, assets)
│   ├── .htaccess         <-- Bevat NIET de proxy regels (die staan in DA config)
│   └── ...
└── backend/              <-- Laravel project
    ├── docker-compose.yml
    ├── Dockerfile
    ├── .env              <-- Connectie settings
    ├── nginx/            <-- Nginx config voor container
    ├── storage/          <-- Logs en sessies (chmod 777)
    └── app/              <-- Laravel code
```

## 6. DirectAdmin Config (Proxy)
Ingesteld via "Custom HTTPD Configurations" voor `manoeuvreerspel.netwerkspel.nl`:

```apache
|*if SUB="manoeuvreerspel"|
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:8080/api
    ProxyPassReverse /api http://127.0.0.1:8080/api
    ProxyPass /sanctum http://127.0.0.1:8080/sanctum
    ProxyPassReverse /sanctum http://127.0.0.1:8080/sanctum
|*endif|
```
*Dit zorgt ervoor dat https://manoeuvreerspel.netwerkspel.nl/api/user aankomt bij de Docker container.*
