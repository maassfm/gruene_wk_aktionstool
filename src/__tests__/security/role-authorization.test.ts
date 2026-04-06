/**
 * Sicherheitstests: Rollenberechtigung
 *
 * Prüft, dass EXPERT-Benutzer keinen Zugriff auf Admin-Endpunkte haben.
 * Nur ADMIN-Benutzer dürfen Benutzer, Teams und Statistiken verwalten.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuth, createRequest, createJsonRequest, EXPERT_TEAM_A } from "./helpers";

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
vi.mock("@/lib/geocoding", () => ({ geocodeAddress: vi.fn() }));
vi.mock("@/lib/email-templates", () => ({
  anmeldebestaetigungEmail: vi.fn(() => ({ subject: "", html: "" })),
  aenderungsEmail: vi.fn(() => ({ subject: "", html: "" })),
  absageEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  await mockAuth(EXPERT_TEAM_A); // Angemeldet als EXPERT
});

describe("EXPERT darf nicht auf Admin-Benutzerverwaltung zugreifen", () => {
  it("GET /api/admin/users → 401 für EXPERT", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/users → 401 für EXPERT", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", {
      name: "Hacker",
      email: "hacker@test.de",
      password: "password123",
      role: "ADMIN",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("PUT /api/admin/users → 401 für EXPERT", async () => {
    const { PUT } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", { id: "admin-1", role: "ADMIN" }, "PUT");
    const res = await PUT(req as any);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/admin/users → 401 für EXPERT", async () => {
    const { DELETE } = await import("@/app/api/admin/users/route");
    const req = createRequest("/api/admin/users?id=admin-1", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });
});

describe("EXPERT darf nicht auf Admin-Teamverwaltung zugreifen", () => {
  it("GET /api/admin/teams → 401 für EXPERT", async () => {
    const { GET } = await import("@/app/api/admin/teams/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/teams → 401 für EXPERT", async () => {
    const { POST } = await import("@/app/api/admin/teams/route");
    const req = createJsonRequest("/api/admin/teams", { name: "Neues Team" });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/admin/teams → 401 für EXPERT", async () => {
    const { DELETE } = await import("@/app/api/admin/teams/route");
    const req = createRequest("/api/admin/teams?id=team-1", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });
});

describe("EXPERT darf nicht auf Admin-Statistiken zugreifen", () => {
  it("GET /api/admin/stats → 401 für EXPERT", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
