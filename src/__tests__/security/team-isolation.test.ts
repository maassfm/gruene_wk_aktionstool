/**
 * Sicherheitstests: Team-Datenisolierung
 *
 * Der KRITISCHSTE Test: Stellt sicher, dass ein EXPERT nur Daten
 * seines eigenen Teams sehen und bearbeiten kann. Verhindert, dass
 * persönliche Daten (Namen, E-Mails, Telefonnummern) an unbefugte
 * Team-Mitglieder gelangen.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuth, createRequest, createJsonRequest, EXPERT_TEAM_A, ADMIN_SESSION } from "./helpers";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const mockPrisma = {
  aktion: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  anmeldung: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  team: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn() },
  wahlkreis: { findMany: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/geocoding", () => ({ geocodeAddress: vi.fn() }));
vi.mock("@/lib/email-templates", () => ({
  anmeldebestaetigungEmail: vi.fn(() => ({ subject: "", html: "" })),
  aenderungsEmail: vi.fn(() => ({ subject: "", html: "" })),
  absageEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

vi.mock("@/lib/excel", () => ({
  createAnmeldungenExcel: vi.fn(() => new ArrayBuffer(0)),
  createAnmeldungenTxt: vi.fn(() => ""),
  createAktionenExcel: vi.fn(() => new ArrayBuffer(0)),
  createAktionenTxt: vi.fn(() => ""),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Team-Isolation: Anmeldungen (persönliche Daten)", () => {
  it("EXPERT kann Anmeldungen des eigenen Teams abrufen", async () => {
    await mockAuth(EXPERT_TEAM_A);

    // Aktion gehört zu Team A
    mockPrisma.aktion.findUnique.mockResolvedValue({ id: "aktion-1", teamId: "team-a" });
    mockPrisma.anmeldung.findMany.mockResolvedValue([
      { id: "a1", vorname: "Max", nachname: "Muster", email: "max@test.de", telefon: "0171234", signalName: null },
    ]);

    const { GET } = await import("@/app/api/aktionen/[id]/anmeldungen/route");
    const req = createRequest("/api/aktionen/aktion-1/anmeldungen");
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].vorname).toBe("Max");
  });

  it("EXPERT kann NICHT Anmeldungen eines fremden Teams abrufen → 403", async () => {
    await mockAuth(EXPERT_TEAM_A);

    // Aktion gehört zu Team B – NICHT Team A
    mockPrisma.aktion.findUnique.mockResolvedValue({ id: "aktion-2", teamId: "team-b" });

    const { GET } = await import("@/app/api/aktionen/[id]/anmeldungen/route");
    const req = createRequest("/api/aktionen/aktion-2/anmeldungen");
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-2" }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Kein Zugriff");

    // Sicherstellen, dass keine Anmeldungsdaten abgerufen wurden
    expect(mockPrisma.anmeldung.findMany).not.toHaveBeenCalled();
  });

  it("ADMIN kann Anmeldungen aller Teams abrufen", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.aktion.findUnique.mockResolvedValue({ id: "aktion-2", teamId: "team-b" });
    mockPrisma.anmeldung.findMany.mockResolvedValue([
      { id: "a1", vorname: "Lisa", nachname: "Test", email: "lisa@test.de" },
    ]);

    const { GET } = await import("@/app/api/aktionen/[id]/anmeldungen/route");
    const req = createRequest("/api/aktionen/aktion-2/anmeldungen");
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-2" }) });

    expect(res.status).toBe(200);
  });
});

describe("Team-Isolation: Aktionen bearbeiten", () => {
  it("EXPERT kann NICHT Aktion eines fremden Teams bearbeiten → 403", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.aktion.findUnique.mockResolvedValue({
      id: "aktion-2",
      teamId: "team-b",
      anmeldungen: [],
      adresse: "Alte Straße 1",
      datum: new Date("2025-06-01"),
      startzeit: "10:00",
      endzeit: "12:00",
    });

    const { PUT } = await import("@/app/api/aktionen/[id]/route");
    const req = createJsonRequest("/api/aktionen/aktion-2", {
      titel: "Gehackt",
      datum: "2025-06-01",
      startzeit: "10:00",
      endzeit: "12:00",
      adresse: "Neue Straße 1",
      wahlkreisId: "wk-1",
      ansprechpersonName: "Test",
      ansprechpersonEmail: "test@test.de",
      ansprechpersonTelefon: "0170000",
    }, "PUT");

    const res = await PUT(req as any, { params: Promise.resolve({ id: "aktion-2" }) });

    expect(res.status).toBe(403);
    expect(mockPrisma.aktion.update).not.toHaveBeenCalled();
  });

  it("EXPERT kann NICHT Aktion eines fremden Teams löschen → 403", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.aktion.findUnique.mockResolvedValue({
      id: "aktion-2",
      teamId: "team-b",
      anmeldungen: [],
    });

    const { DELETE } = await import("@/app/api/aktionen/[id]/route");
    const req = createRequest("/api/aktionen/aktion-2", { method: "DELETE" });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "aktion-2" }) });

    expect(res.status).toBe(403);
    expect(mockPrisma.aktion.update).not.toHaveBeenCalled();
  });
});

describe("Team-Isolation: Datenexport", () => {
  it("EXPERT-Export filtert automatisch auf eigenes Team", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.anmeldung.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export/route");
    const req = createRequest("/api/export?format=txt");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    // Prüfen, dass der Prisma-Aufruf den Team-Filter enthält
    const callArgs = mockPrisma.anmeldung.findMany.mock.calls[0][0];
    expect(callArgs.where.aktion).toBeDefined();
    expect(callArgs.where.aktion.teamId).toEqual({ in: ["team-a"] });
  });

  it("EXPERT kann NICHT Daten anderer Teams exportieren (teamId-Parameter wird ignoriert)", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.anmeldung.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export/route");
    // Versuch, Team B zu exportieren
    const req = createRequest("/api/export?format=txt&teamId=team-b");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    // Auch wenn teamId=team-b übergeben wird, muss der Filter team-a verwenden
    const callArgs = mockPrisma.anmeldung.findMany.mock.calls[0][0];
    expect(callArgs.where.aktion.teamId).toEqual({ in: ["team-a"] });
  });
});

describe("Team-Isolation: Aktionen-Export (export-aktionen)", () => {
  it("EXPERT-Export filtert automatisch auf eigenes Team", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.aktion.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export-aktionen/route");
    const req = createRequest("/api/export-aktionen?format=txt");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    const callArgs = mockPrisma.aktion.findMany.mock.calls[0][0];
    expect(callArgs.where.teamId).toEqual({ in: ["team-a"] });
  });

  it("EXPERT kann NICHT Aktionen anderer Teams exportieren (teamId-Parameter wird ignoriert)", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.aktion.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export-aktionen/route");
    const req = createRequest("/api/export-aktionen?format=txt&teamId=team-b");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    // Auch wenn teamId=team-b übergeben wird, muss der Filter team-a verwenden
    const callArgs = mockPrisma.aktion.findMany.mock.calls[0][0];
    expect(callArgs.where.teamId).toEqual({ in: ["team-a"] });
  });

  it("ADMIN sieht alle Aktionen ohne Filter", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.aktion.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export-aktionen/route");
    const req = createRequest("/api/export-aktionen?format=txt");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    const callArgs = mockPrisma.aktion.findMany.mock.calls[0][0];
    expect(callArgs.where).not.toHaveProperty("teamId");
  });

  it("ADMIN kann nach teamId filtern", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.aktion.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/export-aktionen/route");
    const req = createRequest("/api/export-aktionen?format=txt&teamId=team-b");
    const res = await GET(req as any);

    expect(res.status).toBe(200);

    const callArgs = mockPrisma.aktion.findMany.mock.calls[0][0];
    expect(callArgs.where.teamId).toBe("team-b");
  });
});

describe("PII-Schutz: Oeffentlicher Aktionszugriff", () => {
  const aktionMitPII = {
    id: "aktion-1",
    teamId: "team-a",
    ansprechpersonName: "Max Muster",
    ansprechpersonEmail: "max@test.de",
    ansprechpersonTelefon: "0171234",
    wahlkreis: { id: "wk-1", name: "WK1", nummer: 1 },
    team: { id: "team-a", name: "Team A" },
    _count: { anmeldungen: 3 },
  };

  it("Unauthentifizierter Caller sieht keine Kontakt-PII", async () => {
    await mockAuth(null);

    mockPrisma.aktion.findUnique.mockResolvedValue(aktionMitPII);

    const { GET } = await import("@/app/api/aktionen/[id]/route");
    const req = createRequest("/api/aktionen/aktion-1");
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.ansprechpersonName).toBe("Max Muster");
    expect(data.ansprechpersonEmail).toBeUndefined();
    expect(data.ansprechpersonTelefon).toBeUndefined();
  });

  it("Authentifizierter Nutzer sieht Kontakt-PII", async () => {
    await mockAuth(EXPERT_TEAM_A);

    mockPrisma.aktion.findUnique.mockResolvedValue(aktionMitPII);

    const { GET } = await import("@/app/api/aktionen/[id]/route");
    const req = createRequest("/api/aktionen/aktion-1");
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.ansprechpersonEmail).toBe("max@test.de");
    expect(data.ansprechpersonTelefon).toBe("0171234");
  });
});
