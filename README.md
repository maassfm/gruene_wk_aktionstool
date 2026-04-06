# Aktionskoordination - Wahlkampf-Koordinationsplattform

Ermöglicht die Verwaltung von Wahlkampfaktionen, Freiwilligen-Anmeldungen, Excel-Import/Export und automatische E-Mail-Benachrichtigungen. Die Plattform ist vollständig über Umgebungsvariablen konfigurierbar und kann von beliebigen Kreisverbänden eingesetzt werden — ohne Code-Änderungen.

## Tech-Stack

- **Framework:** Next.js 16 (App Router)
- **Sprache:** TypeScript
- **Datenbank:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (Credentials Provider, JWT)
- **Styling:** Tailwind CSS v4 (Corporate Design Grüne)
- **Karten:** Leaflet + React-Leaflet (OpenStreetMap)
- **E-Mail:** Nodemailer (SMTP)
- **Excel:** ExcelJS

## Funktionen

- **Öffentliche Aktionsübersicht** mit Karte, Filtern (Wahlkreis, Datum, Tageszeit) und Sammelanmeldung
- **Freiwilligen-Registrierung** mit DSGVO-konformer Einwilligung und Honeypot-Spamschutz
- **Abmeldung** — Freiwillige können sich über einen Link in der Bestätigungs-E-Mail abmelden
- **Expert-Dashboard** zur Verwaltung von Team-Aktionen (CRUD, Status-Änderungen)
- **Excel-Upload** mit Validierung, Vorschau und automatischem Geocoding
- **Excel-Vorlage** zum Download als Importvorlage
- **Admin-Bereich** für Benutzer-, Team- und Wahlkreis-Verwaltung mit Statistik-Dashboard
- **E-Mail-System** via SMTP (Bestätigung, Änderung, Absage, tägliche Übersicht)
- **Export** als Excel oder Signal-Textformat
- **Cron-Jobs:** Tägliche Übersichts-E-Mail, Erinnerungs-E-Mails an Angemeldete (Abend vor der Aktion) und automatische Löschung von Anmeldedaten nach 72 Stunden

---

## Lokale Entwicklung mit DDEV

### Voraussetzungen

- [DDEV](https://ddev.readthedocs.io/en/stable/) (v1.23+)
- [Docker](https://docs.docker.com/get-docker/) oder [OrbStack](https://orbstack.dev/) (macOS)

### 1. Repository klonen

```bash
git clone <repository-url>
cd grn_actions
```

### 2. DDEV-Projekt konfigurieren

```bash
ddev config --project-type=generic --docroot=. --webserver-type=nginx-fpm
```

Alternativ die mitgelieferte Konfiguration verwenden — die Datei `.ddev/config.yaml` sollte bereits vorhanden sein (siehe unten). Falls nicht, erstelle sie:

```yaml
# .ddev/config.yaml
name: gruene-aktionen
type: generic
docroot: ""
php_version: ""
webserver_type: generic
database:
  type: postgres
  version: "16"
nodejs_version: "22"
web_extra_exposed_ports:
  - name: nextjs
    container_port: 3000
    http_port: 3000
    https_port: 3001
hooks:
  post-start:
    - exec: "npm install"
    - exec: "npx prisma generate"
```

### 3. DDEV starten

```bash
ddev start
```

DDEV startet automatisch einen PostgreSQL-Container und installiert Node.js 22.

### 4. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Die `.env`-Datei mit der DDEV-Datenbank-URL anpassen:

```env
DATABASE_URL=postgresql://db:db@db:5432/db
NEXTAUTH_SECRET=ein-zufaelliger-string-mindestens-32-zeichen
NEXTAUTH_URL=https://gruene-aktionen.ddev.site:3001
AUTH_TRUST_HOST=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@localhost
EMAIL_FROM_NAME="Kreisvorstand B90/GRÜNE Berlin-Mitte"
CRON_SECRET=ein-geheimer-cron-token
```

> **Hinweis:** In DDEV ist der PostgreSQL-Host `db`, Benutzer `db`, Passwort `db`, Datenbank `db`. `AUTH_TRUST_HOST=true` ist für DDEV/Proxy-Setups nötig. Für lokale Entwicklung ohne E-Mail-Versand können `SMTP_USER` und `SMTP_PASSWORD` leer bleiben — E-Mails werden dann übersprungen.

### 5. Datenbank-Migration und Seed

```bash
ddev exec npx prisma migrate dev --name init
ddev exec npx prisma db seed
```

### 6. Entwicklungsserver starten

```bash
ddev exec npm run dev
```

Die App ist erreichbar unter:

- **https://gruene-aktionen.ddev.site:3001** (HTTPS via DDEV-Router)
- **http://localhost:3000** (direkt, wenn Port 3000 exposed)

### Test-Zugangsdaten

| Rolle  | E-Mail                     | Passwort     |
|--------|----------------------------|--------------|
| Admin  | admin@gruene-mitte.de      | admin1234    |
| Expert | expert@gruene-mitte.de     | expert1234   |

### Nützliche DDEV-Befehle

```bash
# DDEV-Status prüfen
ddev status

# In den Container wechseln
ddev ssh

# Prisma Studio (DB-Browser)
ddev exec npx prisma studio

# Linting
ddev exec npm run lint

# Tests ausführen
ddev exec npm test

# Production-Build testen
ddev exec npm run build

# Datenbank zurücksetzen
ddev exec npx prisma migrate reset

# PostgreSQL-CLI
ddev psql

# DDEV stoppen
ddev stop

# DDEV komplett entfernen (inkl. Datenbank)
ddev delete -O
```

---

## Production-Deployment

Die ausführliche Deployment-Anleitung (Hetzner Cloud, Nginx, SSL, Cron-Jobs, Backups) befindet sich in:

**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

---

## Umgebungsvariablen

### Infrastruktur

| Variable          | Beschreibung                                  | Beispiel                                       |
|-------------------|-----------------------------------------------|-------------------------------------------------|
| `DATABASE_URL`    | PostgreSQL-Verbindungsstring                  | `postgresql://user:pass@localhost:5432/dbname`  |
| `NEXTAUTH_SECRET` | Geheimer Schlüssel für JWT-Signierung         | `openssl rand -base64 32`                       |
| `NEXTAUTH_URL`    | Öffentliche URL der App                       | `https://aktionen.gruene-mitte.de`              |
| `AUTH_TRUST_HOST` | Trust Proxy Headers (für Reverse-Proxy/DDEV)  | `true`                                          |
| `SMTP_HOST`       | SMTP-Server für E-Mail-Versand                | `smtp.example.com`                              |
| `SMTP_PORT`       | SMTP-Port                                     | `587`                                           |
| `SMTP_SECURE`     | TLS direkt ab Verbindungsaufbau (Port 465)    | `false`                                         |
| `SMTP_USER`       | SMTP-Benutzername                             | `user@example.com`                              |
| `SMTP_PASSWORD`   | SMTP-Passwort                                 | *(geheim)*                                      |
| `EMAIL_FROM`      | Absender-Adresse für E-Mails                  | `aktionen@gruene-mitte.de`                      |
| `EMAIL_FROM_NAME` | Anzeigename des Absenders                     | `"Kreisvorstand B90/GRÜNE Berlin-Mitte"`        |
| `CRON_SECRET`     | Bearer-Token für Cron-API-Endpunkte           | `openssl rand -hex 16`                          |

### Kreisverbands-Konfiguration

Alle folgenden Variablen sind **optional** — ohne Angabe werden die Berlin-Mitte-Defaults verwendet. Für den Einsatz in anderen Kreisverbänden die passenden Werte setzen.

#### Organisation & Branding

| Variable                      | Beschreibung                              | Beispiel                                          |
|-------------------------------|-------------------------------------------|----------------------------------------------------|
| `NEXT_PUBLIC_ORG_SHORT_NAME`  | Kurzname (öffentlich, erscheint in der UI) | `B90/GRÜNE Köln`                                  |
| `ORG_FULL_NAME`               | Vollständiger Name                        | `BÜNDNIS 90/DIE GRÜNEN Köln`                      |
| `ORG_LEGAL_NAME`              | Rechtlicher Name (für Datenschutz/Impressum) | `BÜNDNIS 90/DIE GRÜNEN Kreisverband Köln`      |
| `ORG_RESPONSIBLE`             | Verantwortliche Person/Rolle              | `Kreisvorstand BÜNDNIS 90/DIE GRÜNEN Köln`        |
| `ORG_SUBTITLE`                | Untertitel (erscheint in E-Mail-Headern)  | `Kreisvorstand`                                   |

#### Kontakt & Website

| Variable         | Beschreibung               | Beispiel                          |
|------------------|----------------------------|------------------------------------|
| `CONTACT_EMAIL`  | Haupt-Kontaktadresse       | `info@gruene-koeln.de`            |
| `WEBSITE_URL`    | Website des Kreisverbands  | `www.gruene-koeln.de`             |
| `IMPRESSUM_URL`  | Link zur Impressumsseite   | `https://gruene-koeln.de/impressum` |

#### Adresse

| Variable              | Beschreibung      | Beispiel             |
|-----------------------|-------------------|----------------------|
| `ADDRESS_STREET`      | Straße + Hausnr.  | `Mauritiuswall 1`    |
| `ADDRESS_POSTAL_CODE` | Postleitzahl      | `50676`              |
| `ADDRESS_CITY`        | Stadt             | `Köln`               |

#### Datenschutzbeauftragte*r

| Variable          | Beschreibung                | Beispiel                          |
|-------------------|-----------------------------|-----------------------------------|
| `DSB_NAME`        | Name/Org des/der DSB        | `SCO-CON:SULT`                    |
| `DSB_STREET`      | Straße + Hausnr.            | `Hauptstraße 27`                  |
| `DSB_POSTAL_CODE` | Postleitzahl                | `53604`                           |
| `DSB_CITY`        | Stadt                       | `Bad Honnef`                      |
| `DSB_EMAIL`       | E-Mail-Adresse              | `datenschutz@example.de`          |
| `DSB_PHONE`       | Telefonnummer               | `02224/988290`                    |

#### Aufsichtsbehörde

| Variable               | Beschreibung                  | Beispiel                                    |
|------------------------|-------------------------------|---------------------------------------------|
| `AUFSICHT_NAME`        | Name der Behörde              | `LfDI Baden-Württemberg`                    |
| `AUFSICHT_STREET`      | Straße + Hausnr.              | `Lautenschlagerstr. 20`                     |
| `AUFSICHT_POSTAL_CODE` | Postleitzahl                  | `70173`                                     |
| `AUFSICHT_CITY`        | Stadt                         | `Stuttgart`                                 |
| `AUFSICHT_PHONE`       | Telefonnummer                 | `0711 / 615541-0`                           |
| `AUFSICHT_EMAIL`       | E-Mail-Adresse                | `poststelle@lfdi.bwl.de`                    |
| `AUFSICHT_URL`         | Website der Behörde           | `https://www.baden-wuerttemberg.datenschutz.de` |

#### Auftragsverarbeiter

| Variable                    | Beschreibung                          | Beispiel                                       |
|-----------------------------|---------------------------------------|------------------------------------------------|
| `HOSTING_PROVIDER`          | Hosting-Anbieter                      | `Hetzner Online GmbH`                          |
| `HOSTING_ADDRESS`           | Adresse des Hosting-Anbieters         | `Industriestr. 25, 91710 Gunzenhausen`         |
| `HOSTING_LOCATION`          | Standort der Server                   | `Deutschland`                                  |
| `HOSTING_PRIVACY_URL`       | Datenschutzerklärung des Hosters      | `https://www.hetzner.com/de/legal/privacy-policy` |
| `EMAIL_PROVIDER`            | E-Mail-Dienstleister                  | `Verdigado eG`                                 |
| `EMAIL_PROVIDER_PRIVACY_URL`| Datenschutzerklärung des E-Mail-Anbieters | `https://www.verdigado.com/datenschutz`    |

#### Sonstiges

| Variable                | Beschreibung                              | Beispiel              |
|-------------------------|-------------------------------------------|-----------------------|
| `DATENSCHUTZ_STAND`     | Datum der Datenschutzerklärung            | `März 2026`           |
| `ACCOUNT_DELETION_DATE` | Frist für Datenlöschung nach Wahlkampf    | `31. Oktober 2026`    |

#### Wahlkreise

| Variable         | Beschreibung                                                                 | Beispiel |
|------------------|------------------------------------------------------------------------------|----------|
| `WAHLKREISE_JSON` | JSON-Array mit `{nummer, name}` pro Wahlkreis. Wenn nicht gesetzt, werden die 7 Wahlkreise von Berlin-Mitte als Standard verwendet. Die Nummern müssen mit den Werten im Excel-Import übereinstimmen. | `'[{"nummer":1,"name":"Wahlkreis 1"},{"nummer":2,"name":"Wahlkreis 2"}]'` |

---

## Projektstruktur

```
├── .ddev/
│   └── config.yaml              # DDEV-Konfiguration
├── docs/
│   ├── DEPLOYMENT.md            # Deployment-Anleitung
│   ├── anleitung-wahlkampfexperten.md  # Benutzerhandbuch
│   └── design.md                # Design-Dokumentation
├── prisma/
│   ├── migrations/              # Datenbank-Migrationen
│   ├── schema.prisma            # Datenmodell
│   └── seed.ts                  # Testdaten
├── public/                      # Statische Dateien (Logos, Fonts)
├── src/
│   ├── __tests__/
│   │   └── security/            # Auth-, Rollen- und Sicherheitstests
│   ├── app/
│   │   ├── (auth)/              # Login-Seite
│   │   ├── (public)/            # Öffentliche Seiten (Übersicht, Anmeldung, Abmeldung, Datenschutz)
│   │   ├── admin/               # Admin-Bereich (Nutzer, Teams, Statistiken)
│   │   ├── dashboard/           # Expert-Dashboard (Aktionen-Verwaltung)
│   │   └── api/                 # API-Routen
│   │       ├── admin/           #   Admin-Endpunkte (stats, teams, users, aktionen)
│   │       ├── aktionen/        #   Aktionen-CRUD + Anmeldungen pro Aktion
│   │       ├── anmeldungen/     #   Registrierung + Abmeldung
│   │       ├── cron/            #   daily-summary, cleanup-anmeldungen, send-erinnerungen
│   │       ├── export/          #   Excel-/Signal-Export (Anmeldungen)
│   │       ├── export-aktionen/ #   Aktionen-Export
│   │       ├── upload/          #   Excel-Upload
│   │       ├── vorlage/         #   Excel-Vorlage Download
│   │       └── wahlkreise/      #   Wahlkreis-Liste
│   ├── components/
│   │   ├── ui/                  # UI-Primitives (Button, Input, Card, Dialog, Badge, Select)
│   │   ├── AktionCard.tsx       # Aktionskarte
│   │   ├── AktionMap.tsx        # Leaflet-Kartenkomponente
│   │   ├── AnmeldeFormular.tsx   # Anmeldeformular
│   │   ├── ExcelUpload.tsx      # Excel-Upload mit Vorschau
│   │   ├── FilterBar.tsx        # Wahlkreis-/Datum-/Tageszeit-Filter
│   │   └── SelectionBar.tsx     # Sammelanmeldungs-Leiste
│   └── lib/
│       ├── auth.ts              # NextAuth-Konfiguration
│       ├── db.ts                # Prisma-Client-Singleton
│       ├── district-config.ts   # Kreisverbands-Konfiguration (alle Org-Werte)
│       ├── email.ts             # E-Mail-Versand (Nodemailer)
│       ├── email-templates.ts   # HTML-E-Mail-Templates
│       ├── excel.ts             # Excel-Import/-Export (ExcelJS)
│       ├── geocoding.ts         # Nominatim-Geocoding
│       └── validators.ts        # Zod-Schemas
├── .env.example
├── next.config.ts
├── vitest.config.ts
└── package.json
```

---

## Lizenz

Lizenziert unter der European Union Public Licence v. 1.2 (EUPL-1.2).
Der vollständige Lizenztext befindet sich in der Datei LICENSE in diesem Repository
sowie unter: https://eupl.eu/1.2/de/
