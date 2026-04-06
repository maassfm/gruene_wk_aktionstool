# Deployment-Anleitung: Hetzner Production-Server

Schritt-für-Schritt-Anleitung für das Deployment der Aktionskoordinations-Plattform auf einem Hetzner Cloud Server.

---

## Inhaltsverzeichnis

1. [Server-Anforderungen](#1-server-anforderungen)
2. [Server-Zugang einrichten](#2-server-zugang-einrichten)
3. [System vorbereiten](#3-system-vorbereiten)
4. [Datenbank einrichten](#4-datenbank-einrichten)
5. [App-Benutzer und Repository](#5-app-benutzer-und-repository)
6. [Umgebungsvariablen konfigurieren](#6-umgebungsvariablen-konfigurieren)
7. [Datenbank migrieren und Seeds einspielen](#7-datenbank-migrieren-und-seeds-einspielen)
8. [Anwendung bauen](#8-anwendung-bauen)
9. [Systemd-Service einrichten](#9-systemd-service-einrichten)
10. [Nginx Reverse-Proxy einrichten](#10-nginx-reverse-proxy-einrichten)
11. [SSL-Zertifikat (Let's Encrypt)](#11-ssl-zertifikat-lets-encrypt)
12. [Firewall konfigurieren](#12-firewall-konfigurieren)
13. [Cron-Jobs einrichten](#13-cron-jobs-einrichten)
14. [Datenbank-Backup einrichten](#14-datenbank-backup-einrichten)
15. [Deployment abschliessen](#15-deployment-abschliessen)
16. [Updates deployen](#16-updates-deployen)
17. [Automatisiertes Deploy-Script](#17-automatisiertes-deploy-script)
18. [Monitoring und Logs](#18-monitoring-und-logs)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Server-Anforderungen

| Eigenschaft | Wert |
|---|---|
| **Hetzner Cloud Typ** | CX22 (2 vCPU, 4 GB RAM) oder größer |
| **Betriebssystem** | Ubuntu 24.04 LTS |
| **Domain** | z.B. `aktionen.gruene-mitte.de` |
| **DNS** | A-Record der Domain auf die Server-IP setzen |

Bevor du beginnst: Stelle sicher, dass der **A-Record** deiner Domain bereits auf die IP-Adresse des neuen Servers zeigt. DNS-Propagierung kann bis zu 24 Stunden dauern, Let's Encrypt benötigt aber einen erreichbaren DNS-Eintrag.

---

## 2. Server-Zugang einrichten

Beim Erstellen des Hetzner Servers einen SSH-Key hinterlegen oder Root-Passwort notieren.

```bash
# Verbindung zum Server herstellen
ssh root@<SERVER-IP>
```

SSH-Zugang absichern (optional, empfohlen):

```bash
# Eigenen SSH-Key hinzufügen (falls noch nicht beim Server-Erstellen gemacht)
ssh-copy-id root@<SERVER-IP>

# Root-Login per Passwort deaktivieren (nur wenn SSH-Key gesetzt!)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

---

## 3. System vorbereiten

Alle folgenden Befehle als `root` ausführen.

### System aktualisieren

```bash
apt update && apt upgrade -y
```

### Node.js 22 LTS installieren

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Version prüfen (sollte 22.x ausgeben)
node --version
npm --version
```

### PostgreSQL 16 installieren

```bash
apt install -y postgresql postgresql-contrib

# Status prüfen
systemctl status postgresql
```

### Nginx und Certbot installieren

```bash
apt install -y nginx certbot python3-certbot-nginx

# Status prüfen
systemctl status nginx
```

### Git installieren

```bash
apt install -y git
```

---

## 4. Datenbank einrichten

```bash
# PostgreSQL-Shell öffnen
sudo -u postgres psql
```

In der PostgreSQL-Shell folgende Befehle ausführen — **Passwort anpassen!**

```sql
CREATE USER gruene WITH PASSWORD 'HIER_SICHERES_PASSWORT_EINSETZEN';
CREATE DATABASE gruene_aktionen OWNER gruene;
GRANT ALL PRIVILEGES ON DATABASE gruene_aktionen TO gruene;
\q
```

Verbindung testen:

```bash
psql -U gruene -h localhost -d gruene_aktionen
# Mit \q beenden
```

---

## 5. App-Benutzer und Repository

### App-Benutzer anlegen

```bash
# Als root
adduser --disabled-password --gecos "" gruene
```

### Repository klonen

```bash
# Zum App-Benutzer wechseln
su - gruene

# Repository klonen (URL anpassen)
git clone <REPOSITORY-URL> ~/app
cd ~/app

# Dependencies installieren
npm ci --production=false
```

---

## 6. Umgebungsvariablen konfigurieren

```bash
# Als Benutzer gruene, im Verzeichnis ~/app
nano ~/app/.env
```

Folgende Variablen eintragen — **alle Platzhalter ersetzen!**

```env
# Datenbank
DATABASE_URL=postgresql://gruene:HIER_SICHERES_PASSWORT_EINSETZEN@localhost:5432/gruene_aktionen

# NextAuth
NEXTAUTH_SECRET=HIER_NEXTAUTH_SECRET_EINSETZEN
NEXTAUTH_URL=https://aktionen.gruene-mitte.de
AUTH_TRUST_HOST=true

# SMTP E-Mail
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aktionen@gruene-mitte.de
SMTP_PASSWORD=HIER_SMTP_PASSWORT_EINSETZEN
EMAIL_FROM=aktionen@gruene-mitte.de
EMAIL_FROM_NAME=Kreisvorstand B90/GRÜNE Berlin-Mitte

# Cron-Job Absicherung
CRON_SECRET=HIER_CRON_SECRET_EINSETZEN

# Laufzeitumgebung
NODE_ENV=production

# ── Kreisverbands-Konfiguration ──────────────────────────────────────
# Alle Werte sind optional (Defaults: BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte).
# Für andere Kreisverbände die passenden Werte setzen.

# Organisation & Branding
NEXT_PUBLIC_ORG_SHORT_NAME="B90/GRÜNE Berlin-Mitte"
ORG_FULL_NAME="BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte"
ORG_LEGAL_NAME="BÜNDNIS 90/DIE GRÜNEN Kreisverband Berlin-Mitte"
ORG_RESPONSIBLE="Kreisvorstand BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte"
ORG_SUBTITLE="Kreisvorstand"

# Kontakt & Website
CONTACT_EMAIL=info@gruene-mitte.de
WEBSITE_URL=www.gruene-mitte.de
IMPRESSUM_URL=https://gruene-mitte.de/impressum

# Adresse
ADDRESS_STREET="Tegeler Straße 31"
ADDRESS_POSTAL_CODE=13353
ADDRESS_CITY=Berlin

# Datenschutzbeauftragte*r
DSB_NAME="SCO-CON:SULT"
DSB_STREET="Hauptstraße 27"
DSB_POSTAL_CODE=53604
DSB_CITY="Bad Honnef"
DSB_EMAIL=datenschutz@gruene-berlin.de
DSB_PHONE="02224/988290"

# Aufsichtsbehörde (je nach Bundesland anpassen!)
AUFSICHT_NAME="Berliner Beauftragte für Datenschutz und Informationsfreiheit"
AUFSICHT_STREET="Alt-Moabit 59–61"
AUFSICHT_POSTAL_CODE=10555
AUFSICHT_CITY=Berlin
AUFSICHT_PHONE="030 / 138 89-0"
AUFSICHT_EMAIL=mailbox@datenschutz-berlin.de
AUFSICHT_URL=https://www.datenschutz-berlin.de

# Auftragsverarbeiter (Hosting)
HOSTING_PROVIDER="Hetzner Online GmbH"
HOSTING_ADDRESS="Industriestr. 25, 91710 Gunzenhausen"
HOSTING_LOCATION=Deutschland
HOSTING_PRIVACY_URL=https://www.hetzner.com/de/legal/privacy-policy

# Auftragsverarbeiter (E-Mail)
EMAIL_PROVIDER="Verdigado eG"
EMAIL_PROVIDER_PRIVACY_URL=https://www.verdigado.com/datenschutz

# Sonstiges
DATENSCHUTZ_STAND="März 2026"
ACCOUNT_DELETION_DATE="31. Oktober 2026"

# Wahlkreise (JSON-Array; wenn nicht gesetzt, werden 7 Berlin-Mitte-Wahlkreise als Default verwendet)
# WAHLKREISE_JSON='[{"nummer":1,"name":"Wahlkreis 1"},{"nummer":2,"name":"Wahlkreis 2"}]'
```

> **Hinweis für andere Kreisverbände:** Die Werte im Abschnitt "Kreisverbands-Konfiguration" steuern das komplette Branding — UI-Texte, E-Mail-Header und -Footer, Datenschutzerklärung und Impressum. Die Aufsichtsbehörde (`AUFSICHT_*`) variiert je nach Bundesland und muss entsprechend angepasst werden.

### Secrets generieren

Neue, zufällige Werte für `NEXTAUTH_SECRET` und `CRON_SECRET` erzeugen:

```bash
# NEXTAUTH_SECRET (min. 32 Zeichen, Base64)
openssl rand -base64 32

# CRON_SECRET (Hex-String)
openssl rand -hex 16
```

Die Ausgaben direkt in die `.env`-Datei eintragen.

### .env-Datei absichern

```bash
chmod 600 ~/app/.env
```

---

## 7. Datenbank migrieren und Seeds einspielen

> **Voraussetzung:** Das Verzeichnis `prisma/migrations/` muss im Repository enthalten sein. Darin liegt die initiale Migration, die alle Tabellen erstellt. Ohne dieses Verzeichnis tut `prisma migrate deploy` nichts.

```bash
# Als Benutzer gruene, im Verzeichnis ~/app
cd ~/app

# Migrations ausführen (erstellt alle Tabellen)
npx prisma migrate deploy

# Seed-Daten einspielen (Wahlkreise, Test-Teams, Demo-Accounts)
npx prisma db seed
```

> **Wichtig:** Der Seed legt Demo-Accounts an (`admin@gruene-mitte.de` / `admin1234` und `expert@gruene-mitte.de` / `expert1234`). Diese Passwörter **müssen** nach dem Deployment geändert werden!

---

## 8. Anwendung bauen

```bash
# Als Benutzer gruene, im Verzeichnis ~/app
npm run build
```

Der Build-Prozess dauert einige Minuten. Das Ergebnis liegt im `.next/`-Verzeichnis.

---

## 9. Systemd-Service einrichten

Zurück zu root wechseln:

```bash
exit  # zurück zu root
```

Service-Unit-Datei erstellen:

```bash
cat > /etc/systemd/system/gruene-aktionen.service << 'EOF'
[Unit]
Description=Grüne Aktionskoordination
After=network.target postgresql.service

[Service]
Type=simple
User=gruene
WorkingDirectory=/home/gruene/app
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
```

Service aktivieren und starten:

```bash
systemctl daemon-reload
systemctl enable gruene-aktionen
systemctl start gruene-aktionen

# Status prüfen
systemctl status gruene-aktionen

# Logs live verfolgen
journalctl -u gruene-aktionen -f
```

Die App sollte jetzt intern auf `http://127.0.0.1:3000` erreichbar sein.

---

## 10. Nginx Reverse-Proxy einrichten

```bash
cat > /etc/nginx/sites-available/gruene-aktionen << 'NGINX'
server {
    listen 80;
    server_name aktionen.gruene-mitte.de;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    client_max_body_size 10M;
}
NGINX

# Site aktivieren
ln -s /etc/nginx/sites-available/gruene-aktionen /etc/nginx/sites-enabled/

# Default-Site deaktivieren
rm -f /etc/nginx/sites-enabled/default

# Konfiguration prüfen und Nginx neu laden
nginx -t && systemctl reload nginx
```

---

## 11. SSL-Zertifikat (Let's Encrypt)

> Voraussetzung: Der DNS-A-Record muss bereits auf den Server zeigen.

```bash
certbot --nginx -d aktionen.gruene-mitte.de
```

Certbot fragt nach einer E-Mail-Adresse für Ablauf-Benachrichtigungen und ob HTTP-Anfragen auf HTTPS umgeleitet werden sollen (empfohlen: **Ja**).

Nach erfolgreicher Ausstellung automatische Erneuerung testen:

```bash
certbot renew --dry-run
```

Die automatische Erneuerung via systemd-Timer ist nach der Certbot-Installation bereits aktiv:

```bash
systemctl status certbot.timer
```

---

## 12. Firewall konfigurieren

```bash
# SSH erlauben (wichtig: nicht vergessen!)
ufw allow OpenSSH

# HTTP und HTTPS erlauben
ufw allow 'Nginx Full'

# Firewall aktivieren
ufw enable

# Status prüfen
ufw status
```

---

## 13. Cron-Jobs einrichten

Drei Cron-Jobs sind erforderlich. Alle rufen gesicherte API-Endpunkte mit dem `CRON_SECRET` auf.

```bash
# Als root
crontab -e
```

Folgende Zeilen hinzufügen — **CRON_SECRET aus der `.env`-Datei eintragen!**

```cron
# Tägliche Übersichts-E-Mail (21:00 Uhr)
0 21 * * * curl -s -X POST -H "Authorization: Bearer HIER_CRON_SECRET_EINSETZEN" http://127.0.0.1:3000/api/cron/daily-summary > /dev/null 2>&1

# Anmeldedaten-Löschung 72h nach Aktionsende (stündlich)
0 * * * * curl -s -X POST -H "Authorization: Bearer HIER_CRON_SECRET_EINSETZEN" http://127.0.0.1:3000/api/cron/cleanup-anmeldungen > /dev/null 2>&1

# Erinnerungs-E-Mails an Angemeldete – Abend vor der Aktion (17:00 UTC = 19:00 CEST / 18:00 CET)
0 17 * * * curl -s -X POST -H "Authorization: Bearer HIER_CRON_SECRET_EINSETZEN" http://127.0.0.1:3000/api/cron/send-erinnerungen > /dev/null 2>&1
```

---

## 14. Datenbank-Backup einrichten

### Backup-Script erstellen

```bash
cat > /home/gruene/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/gruene/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -U gruene -h localhost gruene_aktionen | gzip > "$BACKUP_DIR/gruene_aktionen_$TIMESTAMP.sql.gz"

# Backups älter als 30 Tage löschen
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "$(date): Backup erstellt: $BACKUP_DIR/gruene_aktionen_$TIMESTAMP.sql.gz"
EOF

chmod +x /home/gruene/backup.sh
chown gruene:gruene /home/gruene/backup.sh
```

Backup-Script testen:

```bash
su - gruene -c "/home/gruene/backup.sh"
ls -lh /home/gruene/backups/
```

### Täglichen Backup-Cron einrichten (03:00 Uhr)

```bash
# Crontab für Benutzer gruene setzen
echo "0 3 * * * /home/gruene/backup.sh >> /home/gruene/backup.log 2>&1" | crontab -u gruene -
```

### Backup wiederherstellen

```bash
# Backup entpacken und einspielen
gunzip -c /home/gruene/backups/gruene_aktionen_YYYYMMDD_HHMMSS.sql.gz | psql -U gruene -h localhost gruene_aktionen
```

---

## 15. Deployment abschliessen

### Checkliste

- [ ] App läuft: `systemctl status gruene-aktionen` zeigt `active (running)`
- [ ] HTTPS erreichbar: `https://aktionen.gruene-mitte.de` öffnet die App
- [ ] Login funktioniert
- [ ] **Admin-Passwort geändert** (Standard: `admin1234` — sofort ändern!)
- [ ] **Expert-Passwort geändert** (Standard: `expert1234` — sofort ändern!)
- [ ] **Kreisverbands-Konfiguration angepasst** (Org-Name, Adresse, DSB, Aufsichtsbehörde, Wahlkreise in `.env` gesetzt)
- [ ] Datenschutzerklärung und Impressum im Browser geprüft (korrekte Org-Daten)
- [ ] E-Mail-Versand getestet (Testregistrierung durchführen)
- [ ] Backup-Script getestet
- [ ] Cron-Job für tägliche E-Mails aktiv
- [ ] Cron-Job für Erinnerungs-E-Mails aktiv (0 17 * * *)

### Passwörter ändern

Nach dem ersten Login als Admin unter `/admin/users` die Passwörter aller Accounts ändern.

---

## 16. Updates deployen

```bash
# Als Benutzer gruene
su - gruene
cd ~/app

# Aktuellen Code holen
git pull origin main

# Dependencies aktualisieren
npm ci --production=false

# Datenbank-Migrationen ausführen (falls neue vorhanden)
npx prisma migrate deploy

# Neu bauen
npm run build

# Service neu starten (als root)
exit
systemctl restart gruene-aktionen

# Logs prüfen
journalctl -u gruene-aktionen -f
```

---

## 17. Automatisiertes Deploy-Script

Für bequemere Updates ein Deploy-Script anlegen:

```bash
cat > /home/gruene/deploy.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/home/gruene/app"
SERVICE="gruene-aktionen"

echo "$(date): Deployment gestartet..."

cd "$APP_DIR"

git pull origin main
npm ci --production=false
npx prisma migrate deploy
npm run build

sudo systemctl restart "$SERVICE"

echo "$(date): Deployment abgeschlossen."
echo "Status:"
sudo systemctl status "$SERVICE" --no-pager
EOF

chmod +x /home/gruene/deploy.sh
```

Damit `gruene` den Service neu starten darf, sudo-Berechtigung einrichten:

```bash
# Als root
echo "gruene ALL=(root) NOPASSWD: /bin/systemctl restart gruene-aktionen, /bin/systemctl status gruene-aktionen" \
  > /etc/sudoers.d/gruene-aktionen
chmod 440 /etc/sudoers.d/gruene-aktionen
```

Deployment ausführen:

```bash
su - gruene -c "/home/gruene/deploy.sh"
```

---

## 18. Monitoring und Logs

### App-Logs

```bash
# Live-Logs verfolgen
journalctl -u gruene-aktionen -f

# Letzte 100 Zeilen
journalctl -u gruene-aktionen -n 100

# Logs seit heute
journalctl -u gruene-aktionen --since today
```

### Nginx-Logs

```bash
# Zugriffs-Log
tail -f /var/log/nginx/access.log

# Fehler-Log
tail -f /var/log/nginx/error.log
```

### PostgreSQL-Logs

```bash
tail -f /var/log/postgresql/postgresql-16-main.log
```

### System-Ressourcen

```bash
# Auslastung prüfen
htop

# Festplattenplatz
df -h

# Backup-Verzeichnis
du -sh /home/gruene/backups/
```

---

## 19. Troubleshooting

### App startet nicht

```bash
# Logs prüfen
journalctl -u gruene-aktionen -n 50

# Häufige Ursachen:
# - .env fehlt oder enthält Fehler
# - Datenbankverbindung schlägt fehl
# - Build fehlt (npm run build nicht ausgeführt)
# - Port 3000 belegt

# Port-Belegung prüfen
ss -tlnp | grep 3000
```

### Datenbankverbindung schlägt fehl

```bash
# PostgreSQL-Status
systemctl status postgresql

# Verbindung manuell testen
psql -U gruene -h localhost -d gruene_aktionen -c "SELECT 1;"

# Häufige Ursachen:
# - Falsches Passwort in DATABASE_URL
# - PostgreSQL läuft nicht
# - pg_hba.conf erlaubt keine lokale Verbindung per Passwort
```

### Nginx gibt 502 Bad Gateway zurück

```bash
# App-Prozess läuft?
systemctl status gruene-aktionen

# App intern erreichbar?
curl -s http://127.0.0.1:3000 | head -20

# Nginx-Konfiguration testen
nginx -t
```

### SSL-Zertifikat kann nicht ausgestellt werden

```bash
# DNS-Auflösung prüfen (muss Server-IP zurückgeben)
dig aktionen.gruene-mitte.de

# Port 80 erreichbar? (Certbot braucht HTTP für Validierung)
ufw status
curl -I http://aktionen.gruene-mitte.de

# Certbot-Log
journalctl -u certbot
```

### E-Mails werden nicht versendet

```bash
# SMTP-Verbindung manuell testen
openssl s_client -connect smtp.example.com:587 -starttls smtp

# App-Logs auf E-Mail-Fehler prüfen
journalctl -u gruene-aktionen | grep -i "email\|smtp\|mail"
```

---

## Referenz: Umgebungsvariablen

### Infrastruktur

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | `postgresql://gruene:pass@localhost:5432/gruene_aktionen` |
| `NEXTAUTH_SECRET` | Geheimer Schlüssel für JWT-Signierung (min. 32 Zeichen) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Öffentliche URL der App (mit https://) | `https://aktionen.gruene-mitte.de` |
| `AUTH_TRUST_HOST` | Muss auf `true` gesetzt werden, da die App hinter Nginx läuft | `true` |
| `SMTP_HOST` | SMTP-Server-Hostname | `smtp.example.com` |
| `SMTP_PORT` | SMTP-Port | `587` |
| `SMTP_SECURE` | TLS direkt ab Verbindungsaufbau (Port 465) | `false` |
| `SMTP_USER` | SMTP-Benutzername | `aktionen@gruene-mitte.de` |
| `SMTP_PASSWORD` | SMTP-Passwort | — |
| `EMAIL_FROM` | Absender-E-Mail-Adresse | `aktionen@gruene-mitte.de` |
| `EMAIL_FROM_NAME` | Absender-Anzeigename | `Kreisvorstand B90/GRÜNE Berlin-Mitte` |
| `CRON_SECRET` | Bearer-Token für den Cron-API-Endpunkt | `openssl rand -hex 16` |
| `NODE_ENV` | Laufzeitumgebung | `production` |

### Kreisverbands-Konfiguration (alle optional, Defaults: Berlin-Mitte)

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_ORG_SHORT_NAME` | Kurzname der Organisation (erscheint in der UI) |
| `ORG_FULL_NAME` | Vollständiger Name der Organisation |
| `ORG_LEGAL_NAME` | Rechtlicher Name (für Datenschutz und Impressum) |
| `ORG_RESPONSIBLE` | Verantwortliche Person oder Rolle |
| `ORG_SUBTITLE` | Untertitel (E-Mail-Header) |
| `CONTACT_EMAIL` | Haupt-Kontaktadresse |
| `WEBSITE_URL` | Website des Kreisverbands |
| `IMPRESSUM_URL` | Link zur Impressumsseite |
| `ADDRESS_STREET` | Straße und Hausnummer |
| `ADDRESS_POSTAL_CODE` | Postleitzahl |
| `ADDRESS_CITY` | Stadt |
| `DSB_NAME` | Name oder Organisation der/des Datenschutzbeauftragten |
| `DSB_STREET` | Straße und Hausnummer der/des DSB |
| `DSB_POSTAL_CODE` | Postleitzahl der/des DSB |
| `DSB_CITY` | Stadt der/des DSB |
| `DSB_EMAIL` | E-Mail-Adresse der/des DSB |
| `DSB_PHONE` | Telefonnummer der/des DSB |
| `AUFSICHT_NAME` | Name der zuständigen Datenschutz-Aufsichtsbehörde |
| `AUFSICHT_STREET` | Straße und Hausnummer der Aufsichtsbehörde |
| `AUFSICHT_POSTAL_CODE` | Postleitzahl der Aufsichtsbehörde |
| `AUFSICHT_CITY` | Stadt der Aufsichtsbehörde |
| `AUFSICHT_PHONE` | Telefonnummer der Aufsichtsbehörde |
| `AUFSICHT_EMAIL` | E-Mail-Adresse der Aufsichtsbehörde |
| `AUFSICHT_URL` | Website der Aufsichtsbehörde |
| `HOSTING_PROVIDER` | Name des Hosting-Anbieters |
| `HOSTING_ADDRESS` | Adresse des Hosting-Anbieters |
| `HOSTING_LOCATION` | Serverstandort (Land) |
| `HOSTING_PRIVACY_URL` | Datenschutzerklärung des Hosters |
| `EMAIL_PROVIDER` | Name des E-Mail-Dienstleisters |
| `EMAIL_PROVIDER_PRIVACY_URL` | Datenschutzerklärung des E-Mail-Anbieters |
| `DATENSCHUTZ_STAND` | Datum der Datenschutzerklärung (z.B. `März 2026`) |
| `ACCOUNT_DELETION_DATE` | Frist für Datenlöschung nach Wahlkampf |
| `WAHLKREISE_JSON` | JSON-Array mit `{"nummer": N, "name": "..."}` pro Wahlkreis |
