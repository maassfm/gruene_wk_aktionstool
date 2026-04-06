/**
 * Sicherheitstests: Authentifizierungsschutz
 *
 * Prüft, dass alle geschützten API-Endpunkte unauthentifizierte
 * Anfragen mit Status 401 ablehnen.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuth, createRequest, createJsonRequest } from "./helpers";

// Mocks für auth und Prisma
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
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
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    wahlkreis: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/geocoding", () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock("@/lib/email-templates", () => ({
  anmeldebestaetigungEmail: vi.fn(() => ({ subject: "", html: "" })),
  aenderungsEmail: vi.fn(() => ({ subject: "", html: "" })),
  absageEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  await mockAuth(null); // Kein authentifizierter Benutzer
});

describe("Authentifizierungsschutz: Anmeldungen (persönliche Daten)", () => {
  it("GET /api/aktionen/[id]/anmeldungen → 401 ohne Auth", async () => {
    const { GET } = await import("@/app/api/aktionen/[id]/anmeldungen/route");
    const req = createRequest("/api/aktionen/test-id/anmeldungen");
    const res = await GET(req as any, { params: Promise.resolve({ id: "test-id" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("GET /api/export → 401 ohne Auth", async () => {
    const { GET } = await import("@/app/api/export/route");
    const req = createRequest("/api/export?format=xlsx");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});

describe("Authentifizierungsschutz: Aktionen-Verwaltung", () => {
  it("POST /api/aktionen → 401 ohne Auth", async () => {
    const { POST } = await import("@/app/api/aktionen/route");
    const req = createJsonRequest("/api/aktionen", { titel: "Test" });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("PUT /api/aktionen/[id] → 401 ohne Auth", async () => {
    const { PUT } = await import("@/app/api/aktionen/[id]/route");
    const req = createJsonRequest("/api/aktionen/test-id", { titel: "Test" }, "PUT");
    const res = await PUT(req as any, { params: Promise.resolve({ id: "test-id" }) });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/aktionen/[id] → 401 ohne Auth", async () => {
    const { DELETE } = await import("@/app/api/aktionen/[id]/route");
    const req = createRequest("/api/aktionen/test-id", { method: "DELETE" });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "test-id" }) });
    expect(res.status).toBe(401);
  });
});

describe("Authentifizierungsschutz: Admin-Endpunkte", () => {
  it("GET /api/admin/users → 401 ohne Auth", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/users → 401 ohne Auth", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", { name: "Test" });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("PUT /api/admin/users → 401 ohne Auth", async () => {
    const { PUT } = await import("@/app/api/admin/users/route");
    const req = createJsonRequest("/api/admin/users", { id: "1", name: "Test" }, "PUT");
    const res = await PUT(req as any);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/admin/users → 401 ohne Auth", async () => {
    const { DELETE } = await import("@/app/api/admin/users/route");
    const req = createRequest("/api/admin/users?id=1", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/teams → 401 ohne Auth", async () => {
    const { GET } = await import("@/app/api/admin/teams/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/teams → 401 ohne Auth", async () => {
    const { POST } = await import("@/app/api/admin/teams/route");
    const req = createJsonRequest("/api/admin/teams", { name: "Test" });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/admin/teams → 401 ohne Auth", async () => {
    const { DELETE } = await import("@/app/api/admin/teams/route");
    const req = createRequest("/api/admin/teams?id=1", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats → 401 ohne Auth", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
