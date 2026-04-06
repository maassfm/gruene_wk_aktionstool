/**
 * Sicherheitstests: Datensäuberung
 *
 * Prüft, dass sensible Daten (Passwörter) niemals in API-Responses
 * auftauchen und dass öffentliche Endpunkte keine persönlichen Daten leaken.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuth, ADMIN_SESSION, createJsonRequest } from "./helpers";

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
  anmeldung: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => "$2a$12$hashedpassword"),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Passwörter werden nie in Responses exponiert", () => {
  it("GET /api/admin/users → Passwörter entfernt", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Max Muster",
        email: "max@test.de",
        password: "$2a$12$geheimerHash",
        role: "ADMIN",
        active: true,
        teams: [{ team: { id: "team-1", name: "Team 1" } }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).not.toHaveProperty("password");
    expect(JSON.stringify(data)).not.toContain("geheimerHash");
  });

  it("POST /api/admin/users → Passwort nicht in Response", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.user.findUnique.mockResolvedValue(null); // Kein existierender User
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user",
      name: "Neue Person",
      email: "neu@test.de",
      password: "$2a$12$neuerHash",
      role: "EXPERT",
      active: true,
      teams: [{ team: { id: "team-1", name: "Team 1" } }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", {
      name: "Neue Person",
      email: "neu@test.de",
      password: "sicheres-passwort",
      role: "EXPERT",
      teamIds: ["team-1"],
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).not.toHaveProperty("password");
    expect(JSON.stringify(data)).not.toContain("neuerHash");
  });

  it("PUT /api/admin/users → Passwort nicht in Response", async () => {
    await mockAuth(ADMIN_SESSION);

    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      name: "Geändert",
      email: "max@test.de",
      password: "$2a$12$aktualisierterHash",
      role: "ADMIN",
      active: true,
      teams: [{ team: { id: "team-1", name: "Team 1" } }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { PUT } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", { id: "user-1", name: "Geändert" }, "PUT");
    const res = await PUT(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).not.toHaveProperty("password");
    expect(JSON.stringify(data)).not.toContain("aktualisierterHash");
  });
});

describe("Öffentliche Endpunkte leaken keine persönlichen Daten", () => {
  it("GET /api/aktionen (öffentlich) → enthält keine Anmeldungsdaten", async () => {
    await mockAuth(null); // Nicht authentifiziert

    const mockAktionen = [
      {
        id: "aktion-1",
        titel: "Haustürwahlkampf",
        beschreibung: "Test",
        datum: new Date("2026-06-01"),
        startzeit: "10:00",
        endzeit: "12:00",
        adresse: "Musterstr. 1",
        status: "AKTIV",
        wahlkreis: { id: "wk-1", name: "Wahlkreis 1", nummer: 1 },
        team: { id: "team-1", name: "Team 1" },
        _count: { anmeldungen: 5 },
        // Persönliche Daten die NICHT exponiert werden sollten:
        ansprechpersonName: "Kontakt Person",
        ansprechpersonEmail: "kontakt@gruene.de",
        ansprechpersonTelefon: "030123456",
      },
    ];

    mockPrisma.aktion.findMany.mockResolvedValue(mockAktionen);

    const { GET } = await import("@/app/api/aktionen/route");
    const req = new Request("http://localhost:3000/api/aktionen");
    const res = await GET(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);

    // Anmeldungsdaten (vorname, nachname, email, telefon) dürfen NICHT enthalten sein
    const responseText = JSON.stringify(data);
    expect(responseText).not.toContain("vorname");
    expect(responseText).not.toContain("nachname");
    // Anmelder-E-Mail darf nicht enthalten sein (Ansprechperson-E-Mail ist OK da öffentlich)
    expect(data[0]).not.toHaveProperty("anmeldungen");
  });
});
