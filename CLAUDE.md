# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campaign action coordination platform ("Aktionskoordination") for BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte. Manages campaign actions (Aktionen), volunteer registrations (Anmeldungen), Excel import/export, and email notifications.

**Domain language is German** — models, fields, and UI strings use German terminology throughout.

## Development Commands

Primary development environment is DDEV (Docker-based):

```bash
ddev start                                    # Start all services
ddev exec npm run dev                         # Start Next.js dev server
ddev exec npm run build                       # Production build
ddev exec npm run lint                        # ESLint
ddev exec npm test                            # Run all tests (vitest)
ddev exec npx prisma migrate dev --name <n>  # Create migration
ddev exec npx prisma migrate reset            # Reset DB + reseed
ddev exec npx prisma studio                   # DB browser
ddev psql                                     # PostgreSQL CLI
```

Run a single test file:
```bash
ddev exec npx vitest run src/__tests__/security/auth-protection.test.ts
```

After `ddev start`, the app runs at `https://gruene-aktionen.ddev.site:3001`.

Test credentials (after seeding):
- Admin: `admin@gruene-mitte.de` / `admin1234`
- Expert: `expert@gruene-mitte.de` / `expert1234`

## Architecture

**Stack:** Next.js 16 (App Router) · TypeScript · PostgreSQL + Prisma · NextAuth.js v5 · Tailwind CSS v4 · nodemailer/SMTP (email) · ExcelJS

### Route Structure

- `src/app/(public)/` — public pages: action overview, registration, unsubscribe, privacy policy, impressum
- `src/app/(auth)/` — login
- `src/app/dashboard/` — Expert dashboard (requires EXPERT role), action CRUD
- `src/app/admin/` — Admin area (requires ADMIN role), user/team/Wahlkreis management
- `src/app/api/` — REST endpoints: auth, action CRUD, export (Excel/Signal), upload, cron jobs

Public API routes:
- `/api/aktionen` — list/read actions
- `/api/aktionen/[id]/anmeldungen` — sign up for an action
- `/api/anmeldungen/abmelden` — unsubscribe via cancelToken
- `/api/anmeldungen/meine-aktionen` — list user's registrations
- `/api/wahlkreise` — list electoral districts
- `/api/vorlage` — download Excel import template
- `/api/export` — export signups (Excel/Signal format, EXPERT+)
- `/api/export-aktionen` — export all actions (EXPERT+)
- `/api/upload` — import actions from Excel (EXPERT+)
- `/api/admin/*` — user/team/stats management (ADMIN only)
- `/api/cron/daily-summary` — daily email summary
- `/api/cron/cleanup-anmeldungen` — delete stale signups
- `/api/cron/send-erinnerungen` — send reminder emails before actions

### Data Model

Core entities in `prisma/schema.prisma`:
- **User** (ADMIN | EXPERT roles) → belongs to Teams via UserTeam
- **Team** → belongs to Wahlkreis, owns Aktionen
- **Wahlkreis** — electoral district
- **Aktion** — campaign action with geocoordinates, contact person, status (AKTIV/ABGESAGT/GEAENDERT)
- **Anmeldung** — volunteer registration, unique per (aktionId, email), has `cancelToken` for self-service unsubscribe
- **EmailLog** — audit trail for sent emails (types: BESTAETIGUNG, AENDERUNG, ABSAGE, TAEGLICHE_UEBERSICHT, ABMELDUNG, ERINNERUNG)
- **AktionStatistik** — snapshot preserved when an Aktion is deleted (for historical reporting)

### Key Lib Modules

- `src/lib/auth.ts` — NextAuth config, JWT strategy, role-based session
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/email.ts` — nodemailer SMTP email sending, always logs to EmailLog
- `src/lib/email-templates.ts` — HTML email template functions (`anmeldebestaetigungEmail`, `aenderungsEmail`, `absageEmail`, `tagesUebersichtEmail`, `erinnerungsEmail`)
- `src/lib/excel.ts` — ExcelJS import parser and export generation (Excel + Signal-text)
- `src/lib/geocoding.ts` — address-to-coordinates via Nominatim
- `src/lib/validators.ts` — Zod schemas for all models

### Authorization Pattern

Role checks happen at the API route level. Experts can only access their own team's data (team isolation). The middleware at `src/proxy.ts` (exported as `middleware`) handles route protection — it proxies auth checks rather than directly importing NextAuth (due to Edge runtime constraints).

### Cron Jobs

`/api/cron/daily-summary`, `/api/cron/cleanup-anmeldungen`, and `/api/cron/send-erinnerungen` are protected by `Authorization: Bearer <CRON_SECRET>`. Triggered externally via server cron or curl.

## Tests

Tests live in `src/__tests__/security/` and focus on auth protection, role authorization, data sanitization, input validation, team isolation, rate limiting, and cron auth. Test environment uses `node` (not jsdom) — see `vitest.config.ts`.

## Environment Variables

See `.env.example`. Key variables:
- `DATABASE_URL` — PostgreSQL connection (DDEV: `postgresql://db:db@db:5432/db`)
- `NEXTAUTH_SECRET` — JWT signing key (min 32 chars)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` — SMTP credentials (leave empty to skip email in local dev)
- `EMAIL_FROM`, `EMAIL_FROM_NAME` — sender identity
- `CRON_SECRET` — bearer token for cron endpoints

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Aktionskoordination – BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte**

Eine Web-App zur Koordinierung und Anmeldung von Aktiven bei Wahlkampf-Aktionen für BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte. Freiwillige (häufig ältere Mitglieder) können sich über eine öffentliche Seite für Aktionen anmelden; Experten verwalten Aktionen über ein geschütztes Dashboard; Admins verwalten Teams und Nutzer. Die App verarbeitet personenbezogene Daten (Name, E-Mail, Telefon, Signal-Handle) und unterliegt der DSGVO.

**Core Value:** Freiwillige können sich einfach und sicher für Wahlkampf-Aktionen anmelden — zuverlässig, ohne technische Hürden, datenschutzkonform.

### Constraints

- **Tech Stack:** Bestehender Stack (Next.js, Prisma, NextAuth, Tailwind) — kein Austausch von Core-Dependencies
- **Sprache:** UI und Domänensprache ist Deutsch — bleibt so
- **DSGVO:** Alle Änderungen, die personenbezogene Daten betreffen, müssen DSGVO-konform bleiben
- **Zielgruppe:** UI-Änderungen müssen für ältere, weniger technikaffine Nutzer verständlich sein — keine cleveren Tricks, klare Beschriftungen
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - All application code (strict mode enabled, `noEmit: true`, `isolatedModules: true`)
- CSS - Tailwind utility classes compiled via PostCSS
## Runtime
- Node.js >=20.9.0 (requirement from Next.js; local dev uses v25.8.1)
- npm (lockfile version 3)
- Lockfile: `package-lock.json` present and committed
## Frameworks
- Next.js 16.1.7 - Full-stack React framework using App Router
- React 19.2.3 / react-dom 19.2.3 - UI rendering
- NextAuth.js 5.0.0-beta.30 (`next-auth`) - Session management with JWT strategy
- `@auth/prisma-adapter` 2.11.1 - Prisma adapter (imported but JWT strategy used, not DB sessions)
- Tailwind CSS 4.2.1 - Utility-first CSS via `@tailwindcss/postcss` plugin
- PostCSS configured in `postcss.config.mjs`
- Prisma 6.19.2 (client + CLI) - Schema-first ORM, auto-generated on `postinstall`
- Vitest 4.1.0 - Test runner, `node` environment, no jsdom
- Config: `vitest.config.ts`
- `tsx` 4.21.0 - TypeScript execution for seed scripts (`prisma/seed.ts`)
- ESLint 9 with `eslint-config-next` 16.1.7 (core-web-vitals + TypeScript presets)
- Config: `eslint.config.mjs`
## Key Dependencies
- `zod` 4.3.6 - Runtime validation and schema definition for all model inputs (`src/lib/validators.ts`)
- `bcryptjs` 3.0.3 - Password hashing for credential authentication
- `date-fns` 4.1.0 - Date formatting utilities
- `exceljs` 4.4.0 - Excel import (parsing uploaded .xlsx files) and export (generating .xlsx reports)
- `nodemailer` 7.0.7 - SMTP email delivery for registration confirmations, changes, reminders, and daily summaries
- `leaflet` 1.9.4 + `react-leaflet` 5.0.0 - Interactive map rendering for action locations
- `node-cron` 4.2.1 - Cron scheduling (type definitions only; actual cron triggers are external curl commands)
## TypeScript Configuration
- `strict: true` — full strict mode
- `target: ES2017`
- `moduleResolution: bundler`
- `paths: { "@/*": ["./src/*"] }` — `@/` maps to `src/`
- `incremental: true`
## Next.js Configuration
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
## Development Environment
- Project name: `gruene-aktionen`
- Webserver: nginx-fpm
- PHP version: 8.4 (container base; not used by the app)
- PostgreSQL 16
- Next.js dev server exposed on container port 3000 → https port 3001
- App URL: `https://gruene-aktionen.ddev.site:3001`
- `post-start` hooks: `npm install`, `npx prisma generate`
## Configuration
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — JWT signing secret (min 32 chars required)
- `NEXTAUTH_URL` — canonical app URL
- `AUTH_TRUST_HOST=true` — required for DDEV/proxy setups
- SMTP credentials: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`
- `EMAIL_FROM`, `EMAIL_FROM_NAME` — sender identity
- `CRON_SECRET` — bearer token protecting cron endpoints
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## German Domain Language
- `Aktion` — campaign action
- `Anmeldung` — volunteer registration
- `Wahlkreis` — electoral district
- `Ansprechperson` — contact person
- `Vorname` / `Nachname` — first / last name
- `Datenschutz` — privacy consent
- `Absage` — cancellation
- `Abmeldung` — unsubscribe/deregistration
- `Erinnerung` — reminder
- `Aenderung` — change/modification
- `Tageszeit` — time of day (filter)
- `Uebersicht` — overview/summary
- Umlaut-free spellings in code: `aenderungsEmail`, `absageEmail`, `tagesUebersichtEmail`
- Prisma schema and API response fields match German: `ansprechpersonName`, `ansprechpersonEmail`, `ansprechpersonTelefon`, `createdById`
- Error messages returned from API in German: `"Nicht autorisiert"`, `"Kein Zugriff"`, `"Aktion nicht gefunden"`, `"Serverfehler"`
- Status enum values are German uppercase strings: `AKTIV`, `ABGESAGT`, `GEAENDERT`
## Naming Patterns
- React page files: `page.tsx` (Next.js convention)
- Route handler files: `route.ts`
- Layout files: `layout.tsx`
- Component files: PascalCase, descriptive German names — `AktionCard.tsx`, `AnmeldeFormular.tsx`, `FilterBar.tsx`
- UI primitive files: PascalCase English — `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Dialog.tsx`, `Select.tsx`
- Lib modules: lowercase kebab-free single word — `auth.ts`, `db.ts`, `email.ts`, `excel.ts`, `geocoding.ts`, `validators.ts`
- Template file: `email-templates.ts` (hyphenated exception)
- React components: PascalCase — `DashboardPage`, `EditAktionPage`, `AnmeldeFormular`
- Event handlers: `handle` prefix — `handleSubmit`, `handleCancel`, `handleTouchStart`
- Form update helpers: `updateForm`
- Lib functions: camelCase verbs — `sendEmail`, `geocodeAddress`, `mockAuth`, `createRequest`
- Email template functions: camelCase German names — `anmeldebestaetigungEmail`, `aenderungsEmail`, `absageEmail`, `tagesUebersichtEmail`
- camelCase throughout
- German domain values use German names: `aktionen`, `anmeldungen`, `wahlkreise`, `teamIds`
- Boolean states follow `is`/`has` pattern: `isAdmin`, `isExpanded`, `loading`, `saving`
- Unused destructured variables: discarded with `_` — `const { password: _, ...user } = result`
- `interface` for component props and plain data shapes — `ButtonProps`, `AktionInfo`, `SendEmailParams`
- Named type aliases for union types — `ButtonVariant`, `ButtonSize`
- `z.infer<typeof schema>` for Zod-derived types — `LoginInput`, `AktionInput`, `AnmeldungInput`
- Interfaces are defined inline in the file where they are first used (no separate type files)
- Local interfaces use German domain field names matching Prisma schema exactly
## TypeScript Usage
- `@/*` maps to `src/*` — used throughout: `import { auth } from "@/lib/auth"`, `import Button from "@/components/ui/Button"`
- Avoid. When unavoidable (dynamic Prisma `where` objects, form body destructuring), suppress with inline comment:
- There are 4 such suppressions in the codebase, all in API route handlers for Prisma `where` objects.
- `as unknown as ReturnType<typeof vi.fn>` — used in tests to type-check mocked Prisma methods
- `as any` — used for route handler params in tests (`req as any`)
- `token.sub!` — non-null assertion used once in NextAuth JWT callback
## Import Organization
## Component Patterns
- All interactive components and pages are marked `"use client"` at the top
- Server-only modules (`lib/auth.ts`, `lib/db.ts`, `lib/email.ts`) have no directive
- Layout files that use client hooks (`useSession`, `usePathname`, `useState`) are marked `"use client"`
- Single `form` state object per form, updated with a generic `updateForm` helper
- Separate error state variables for each distinct error type: `error`, `contactError`, `signalError`
- `const [loading, setLoading] = useState(true)` — page-level loading
- `const [saving, setSaving] = useState(false)` — submit-specific loading
- Render guard: `if (loading) return <div>Lade...</div>`
- Client-side `useEffect` + `fetch` — no React Query or SWR
- Multiple parallel fetches: `Promise.all([fetch(...), fetch(...)])`
## API Route Patterns
## Validation
- One schema per entity: `loginSchema`, `userSchema`, `teamSchema`, `aktionSchema`, `anmeldungSchema`, `excelRowSchema`
- Validation messages are in German: `"Bitte gib eine gültige E-Mail-Adresse ein"`, `"Titel muss mindestens 3 Zeichen lang sein"`
- Inferred TypeScript types exported alongside schemas: `type AktionInput = z.infer<typeof aktionSchema>`
- Complex cross-field validation using `.refine()`: telefon or signalName must be present
## Error Handling
- Wrap Prisma/validation calls in `try/catch`
- Specifically check `error.name === "ZodError"` for 400 vs generic 500
- Do not re-throw — always return a `NextResponse.json` with an appropriate status
- `sendEmail` catches all errors internally, logs to `EmailLog` with `FEHLER:` prefix, returns `false`
- Callers do not need to catch email errors
- `setError(...)` on failed API calls, displayed inline
- No global error boundaries observed
## Prisma Client
## Comments
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single Next.js 16 app serving both UI (React Server/Client Components) and backend (API Route Handlers)
- No separate backend process — all server logic lives in `src/app/api/` route handlers
- Role-based access control enforced at the API layer, not the middleware layer (middleware only handles route redirects)
- All database access goes through a shared Prisma singleton (`src/lib/db.ts`)
- Frontend pages use client-side fetch to call internal API routes — there are no Server Actions in use
## Layers
- Purpose: Unauthenticated volunteer-facing pages
- Location: `src/app/(public)/`
- Contains: Action listing, registration form, privacy policy, impressum
- Depends on: `src/app/api/aktionen`, `src/app/api/anmeldungen`, `src/app/api/wahlkreise`
- Used by: End-users (volunteers)
- Purpose: Expert (campaign team) action management
- Location: `src/app/dashboard/`
- Contains: Action list, create/edit forms, registrant view
- Depends on: All `/api/aktionen`, `/api/export`, `/api/upload`, `/api/user/teams`, `/api/wahlkreise` endpoints
- Used by: Users with EXPERT or ADMIN role
- Purpose: Full platform administration
- Location: `src/app/admin/`
- Contains: All-action overview, team CRUD, user CRUD
- Depends on: All `/api/admin/*` endpoints plus standard aktionen endpoints
- Used by: Users with ADMIN role only
- Purpose: All server-side logic, data access, business rules
- Location: `src/app/api/`
- Contains: Route handlers organized by resource (`aktionen`, `anmeldungen`, `export`, `upload`, `admin/*`, `cron/*`)
- Depends on: `src/lib/` modules (db, auth, email, excel, validators, geocoding)
- Used by: UI layers via `fetch()`
- Purpose: Shared utilities and integrations
- Location: `src/lib/`
- Contains: Auth config, Prisma client, email sending, email templates, Excel parsing/generation, geocoding, Zod validators
- Depends on: External services (SMTP, Nominatim), Prisma, NextAuth
- Used by: API layer exclusively
- Purpose: Reusable UI components
- Location: `src/components/`
- Contains: Domain components (`AktionCard`, `AktionMap`, `AnmeldeFormular`, `ExcelUpload`, `FilterBar`, `SelectionBar`) and primitives in `src/components/ui/`
- Depends on: Nothing from `src/lib/` directly — all data comes via props or internal fetch
- Used by: Page components in all three UI layers
## Data Flow
- No global client-side state store (no Redux, Zustand, etc.)
- Session state managed by NextAuth `SessionProvider` in `src/app/providers.tsx`; consumed via `useSession()` in client components
- Page-level state is local React state (`useState`)
- Data fetching is imperative `fetch()` in `useEffect` hooks, not React Query or SWR
## Key Abstractions
- Purpose: Restrict EXPERTs to only their team's data
- Implementation: `session.user.teamIds` (array of team IDs) embedded in JWT at login (`src/lib/auth.ts`)
- Enforcement: Every API handler for EXPERT access adds `where: { teamId: { in: session.user.teamIds } }` to Prisma queries
- Examples: `src/app/api/aktionen/route.ts` (lines 26–31), `src/app/api/aktionen/[id]/route.ts` (lines 54–59), `src/app/api/export/route.ts` (lines 27–30)
- Purpose: Single source of truth for all input shapes
- Location: `src/lib/validators.ts`
- Schemas: `loginSchema`, `userSchema`, `teamSchema`, `aktionSchema`, `anmeldungSchema`, `excelRowSchema`
- Pattern: Every API POST/PUT parses body with `schema.parse(body)` and catches `ZodError` → 400 response
- Purpose: Notify volunteers of registration and changes; notify contact persons of daily summaries
- Sending: `src/lib/email.ts` (`sendEmail()`) wraps nodemailer, always writes to `EmailLog` regardless of success/failure
- Templates: `src/lib/email-templates.ts` — named export functions per type (`anmeldebestaetigungEmail`, `aenderungsEmail`, `absageEmail`, `tagesUebersichtEmail`, `erinnerungsEmail`)
- Purpose: Retain historical participation counts when `Anmeldung` records are deleted or when an `Aktion` is hard-deleted would be blocked
- Note: `onDelete: Restrict` on `AktionStatistik.aktionId` prevents hard-delete of an `Aktion` that already has a statistik record
## Entry Points
- Location: `src/app/(public)/page.tsx`
- Triggers: Any unauthenticated browser request to `/`
- Responsibilities: Renders filterable action list and registration form
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: All `/api/auth/*` requests (login, session, signout)
- Responsibilities: Delegates to NextAuth config in `src/lib/auth.ts`
- Location: `src/app/layout.tsx`
- Responsibilities: Wraps entire app in `SessionProvider` via `src/app/providers.tsx`
## Error Handling
- 401 returned when `auth()` returns null (no session) — used consistently across all protected routes
- 403 returned when session exists but role/team check fails
- 400 returned on `ZodError` with `{ error: "Validierungsfehler", details: error }`
- 404 returned when Prisma `findUnique` returns null
- 500 returned as catch-all for unexpected errors (message: "Serverfehler")
- Email send failures are silently logged to `EmailLog` (return value not checked at call sites — fire-and-forget pattern)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
