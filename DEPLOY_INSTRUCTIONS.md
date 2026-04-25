
# Deployment Instructies — Manoeuvreerspel

---

## 🚀 Frontend Deployment (Automatisch via GitHub Actions)

De frontend (Vite/TypeScript) wordt **automatisch** uitgerold via GitHub Actions bij elke push naar `master`.

- Push naar `master` → GitHub Actions bouwt de app → resultaat wordt via SSH gekopieerd naar de VPS
- **Geen handmatige stap nodig voor de frontend.**

### GitHub Secrets die vereist zijn:
- **HOST**: hostname of IP van de VPS (bijv. `srv123.versio.nl`)
- **USERNAME**: SSH gebruikersnaam
- **SSH_PRIVATE_KEY**: Privé SSH sleutel
- **REMOTE_DIR**: Pad op de server naar de `public_html` map

---

## 🐘 Backend Deployment (Handmatig via SCP + Docker)

De backend (Laravel/PHP) draait in een **Docker container** op de VPS. Git Actions rollen de backend **NIET** automatisch uit.

### Serverinformatie
- **SSH toegang:** `ssh root@netwerkspel.nl`
- **Docker container naam:** `manoeuver_app` (PHP/Laravel)
- **Nginx container naam:** `manoeuver_nginx`
- **Laravel projectpad in container:** `/var/www`

> ⚠️ **Let op:** De host-server draait PHP 7.4. Voer `php artisan` altijd **via Docker** uit, NIET direct op de server!

### Stap 1: Bestanden uploaden via SCP (vanuit lokale PowerShell)

```powershell
# Vanuit de project root: d:\Gamedidactiek\AI\manoeuvreerspel-ts\

# Routes
scp backend/routes/api.php root@netwerkspel.nl:/tmp/api.php

# Controllers (kopieer alleen de gewijzigde bestanden)
scp backend/app/Http/Controllers/HarborController.php root@netwerkspel.nl:/tmp/HarborController.php
scp backend/app/Http/Controllers/ScenarioController.php root@netwerkspel.nl:/tmp/ScenarioController.php
scp backend/app/Http/Controllers/GameController.php root@netwerkspel.nl:/tmp/GameController.php
scp backend/app/Http/Controllers/AdminController.php root@netwerkspel.nl:/tmp/AdminController.php

# Models (indien gewijzigd)
scp backend/app/Models/Harbor.php root@netwerkspel.nl:/tmp/Harbor.php
```

### Stap 2: In container naar het juiste pad kopiëren (in SSH terminal)

```bash
ssh root@netwerkspel.nl
docker cp /tmp/api.php manoeuver_app:/var/www/routes/api.php
docker cp /tmp/HarborController.php manoeuver_app:/var/www/app/Http/Controllers/HarborController.php
docker cp /tmp/ScenarioController.php manoeuver_app:/var/www/app/Http/Controllers/ScenarioController.php
docker cp /tmp/GameController.php manoeuver_app:/var/www/app/Http/Controllers/GameController.php
docker cp /tmp/AdminController.php manoeuver_app:/var/www/app/Http/Controllers/AdminController.php
docker cp /tmp/Harbor.php manoeuver_app:/var/www/app/Models/Harbor.php
```

### Stap 3: Cache legen via Docker

```bash
docker exec -it manoeuver_app sh -lc 'cd /var/www && php artisan optimize:clear'
```

### Stap 4: Database migraties uitvoeren (alleen bij nieuwe migrations)

```bash
docker exec -it manoeuver_app sh -lc 'cd /var/www && php artisan migrate --force'
```

### Pad-check (als er twijfel is)

```bash
docker exec manoeuver_app sh -lc 'find / -name artisan 2>/dev/null | head -n 5'
```

### Controleren of containers draaien

```bash
docker ps
# Verwacht: manoeuver_nginx (poort 8080) en manoeuver_app (poort 9000)
```

---

## 🔑 SSH Sleutelinstellingen

Als SCP om een wachtwoord vraagt en je liever sleutels gebruikt:
1. Genereer een sleutelpaar: `ssh-keygen -t rsa -b 4096 -C "deploy_key"`
2. Voeg de PUBLIC key toe aan `~/.ssh/authorized_keys` op de VPS
3. Gebruik de PRIVATE key lokaal via `ssh -i deploy_key root@netwerkspel.nl`

## Troubleshooting Git Authentication (Windows)
Als `git push` faalt met "Permission denied":
1. Update de remote URL: `git remote set-url origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/REPO.git`
2. Push opnieuw — Windows vraagt dan om het juiste token.
