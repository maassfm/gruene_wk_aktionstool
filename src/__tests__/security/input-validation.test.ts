/**
 * Sicherheitstests: Eingabevalidierung
 *
 * Prüft, dass ungültige, bösartige oder manipulierte Eingaben
 * korrekt abgelehnt werden (Schutz gegen Injection-Angriffe).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuth, createJsonRequest, ADMIN_SESSION } from "./helpers";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    aktion: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    anmeldung: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    team: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn() },
    wahlkreis: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email-templates", () => ({
  anmeldebestaetigungEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

function createAnmeldungBody(overrides: Record<string, unknown> = {}) {
  return {
    aktionIds: ["aktion-1"],
    vorname: "Max",
    nachname: "Muster",
    email: "max@test.de",
    telefon: "01711234567",
    datenschutz: true,
    ...overrides,
  };
}

describe("Eingabevalidierung: Öffentliche Anmeldung", () => {
  it("Ungültige E-Mail-Adresse → 400", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(createAnmeldungBody({ email: "keine-email" })),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("Fehlende Pflichtfelder → 400", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
      body: JSON.stringify({ aktionIds: ["aktion-1"] }), // Nur aktionIds, Rest fehlt
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("Leere aktionIds → 400", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.3" },
      body: JSON.stringify(createAnmeldungBody({ aktionIds: [] })),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("SQL-Injection-Versuch im Namen → wird durch Zod/Prisma abgefangen", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");
    const { prisma } = await import("@/lib/db");

    // Aktion existiert
    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      status: "AKTIV",
      maxTeilnehmer: null,
      _count: { anmeldungen: 0 },
    });
    (prisma.anmeldung.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anm-1" });

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.4" },
      body: JSON.stringify(createAnmeldungBody({
        vorname: "Robert'; DROP TABLE anmeldungen;--",
        nachname: "Muster",
      })),
    });

    const res = await POST(req as any);

    // Prisma parametrisiert alle Queries – SQL-Injection ist nicht möglich.
    // Der Request kann durchgehen (Zod akzeptiert den String), aber Prisma
    // behandelt ihn als sicheren String-Parameter.
    if (res.status === 200) {
      const createCall = (prisma.anmeldung.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Der Wert wird als String-Parameter übergeben, NICHT als SQL ausgeführt
      expect(createCall.data.vorname).toBe("Robert'; DROP TABLE anmeldungen;--");
    }
    // Alternativ: Zod könnte den Wert ablehnen – beides ist akzeptabel
    expect([200, 400]).toContain(res.status);
  });

  it("Datenschutz nicht akzeptiert → 400", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.5" },
      body: JSON.stringify(createAnmeldungBody({ datenschutz: false })),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("Weder Telefon noch Signal angegeben → 400", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.6" },
      body: JSON.stringify({
        aktionIds: ["aktion-1"],
        vorname: "Max",
        nachname: "Muster",
        email: "max@test.de",
        telefon: "",
        signalName: "",
        datenschutz: true,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});

describe("Input-Validierung: PUT /api/admin/users (userUpdateSchema)", () => {
  it("PUT ohne ID wird abgelehnt (400)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    const req = createJsonRequest("/api/admin/users", { name: "Test" }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validierungsfehler");
    expect(prisma.user.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("PUT mit ungueltigem E-Mail-Format wird abgelehnt (400)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    const req = createJsonRequest("/api/admin/users", { id: "user-1", email: "not-an-email" }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(400);
    expect(prisma.user.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("PUT mit zu kurzem Passwort wird abgelehnt (400)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    const req = createJsonRequest("/api/admin/users", { id: "user-1", password: "abc" }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(400);
    expect(prisma.user.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("PUT mit ungueltiger Role wird abgelehnt (400)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    const req = createJsonRequest("/api/admin/users", { id: "user-1", role: "SUPERADMIN" }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(400);
    expect(prisma.user.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("PUT mit gueltigem partiellem Update funktioniert (200)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Neuer Name",
      email: "test@test.de",
      role: "EXPERT",
      active: true,
      password: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      teams: [],
    });

    const req = createJsonRequest("/api/admin/users", { id: "user-1", name: "Neuer Name" }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(200);
    expect(prisma.user.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
  });

  it("PUT mit active=false funktioniert (boolean-Validierung)", async () => {
    await mockAuth(ADMIN_SESSION);
    const { PUT } = await import("@/app/api/admin/users/route");
    const { prisma } = await import("@/lib/db");

    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@test.de",
      role: "EXPERT",
      active: false,
      password: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      teams: [],
    });

    const req = createJsonRequest("/api/admin/users", { id: "user-1", active: false }, "PUT");
    const res = await PUT(req as any);

    expect(res.status).toBe(200);
    expect(prisma.user.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ active: false }),
      })
    );
  });
});
