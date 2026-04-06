/**
 * Sicherheitstests: Rate-Limiting für öffentliche GET-Endpunkte (SEC-05)
 *
 * Prüft, dass GET /api/aktionen und GET /api/aktionen/[id]
 * vor systematischem Datenharvesting geschützt sind.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null), // Kein angemeldeter User (public endpoint)
}));

vi.mock("@/lib/geocoding", () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email-templates", () => ({
  anmeldebestaetigungEmail: vi.fn(() => ({ subject: "", html: "" })),
  aenderungsEmail: vi.fn(() => ({ subject: "", html: "" })),
  absageEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Rate-Limit-Map zurücksetzen, indem Modul neu geladen wird
  vi.resetModules();
});

function createGetRequest(url: string, ip: string): Request {
  return new Request(`http://localhost:3000${url}`, {
    method: "GET",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("Rate-Limiting: GET /api/aktionen (SEC-05)", () => {
  it("Test 1: Erlaubt 60 Anfragen pro IP — keine 429 bei normaler Nutzung", async () => {
    const { GET } = await import("@/app/api/aktionen/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const testIp = "192.168.1.10";

    // 60 Anfragen sollten durchgehen
    for (let i = 0; i < 60; i++) {
      const req = createGetRequest("/api/aktionen", testIp);
      const res = await GET(req as any);
      expect(res.status).not.toBe(429);
    }
  });

  it("Test 2: Blockiert die 61. Anfrage von derselben IP mit 429 und deutschem Fehlertext", async () => {
    const { GET } = await import("@/app/api/aktionen/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const testIp = "192.168.1.20";

    // 60 Anfragen durchlassen
    for (let i = 0; i < 60; i++) {
      const req = createGetRequest("/api/aktionen", testIp);
      await GET(req as any);
    }

    // 61. Anfrage muss blockiert werden
    const req = createGetRequest("/api/aktionen", testIp);
    const res = await GET(req as any);
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toContain("Zu viele Anfragen");
  });

  it("Test 6: Unterschiedliche IPs werden unabhängig limitiert", async () => {
    const { GET } = await import("@/app/api/aktionen/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    // 60 Anfragen von IP A durchlassen (Rate-Limit erreicht)
    for (let i = 0; i < 60; i++) {
      const req = createGetRequest("/api/aktionen", "10.0.0.1");
      await GET(req as any);
    }

    // IP B sollte trotzdem funktionieren
    const req = createGetRequest("/api/aktionen", "10.0.0.2");
    const res = await GET(req as any);
    expect(res.status).not.toBe(429);
  });
});

describe("Rate-Limiting: GET /api/aktionen/[id] (SEC-05)", () => {
  it("Test 3: Erlaubt 30 Anfragen pro IP — keine 429 bei normaler Nutzung", async () => {
    const { GET } = await import("@/app/api/aktionen/[id]/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      titel: "Test Aktion",
      wahlkreis: { id: "wk-1", name: "Mitte", nummer: 1 },
      team: null,
      _count: { anmeldungen: 0 },
    });

    const testIp = "192.168.1.30";

    // 30 Anfragen sollten durchgehen
    for (let i = 0; i < 30; i++) {
      const req = createGetRequest("/api/aktionen/aktion-1", testIp);
      const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });
      expect(res.status).not.toBe(429);
    }
  });

  it("Test 4: Blockiert die 31. Anfrage von derselben IP mit 429 und deutschem Fehlertext", async () => {
    const { GET } = await import("@/app/api/aktionen/[id]/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      titel: "Test Aktion",
      wahlkreis: { id: "wk-1", name: "Mitte", nummer: 1 },
      team: null,
      _count: { anmeldungen: 0 },
    });

    const testIp = "192.168.1.40";

    // 30 Anfragen durchlassen
    for (let i = 0; i < 30; i++) {
      const req = createGetRequest("/api/aktionen/aktion-1", testIp);
      await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });
    }

    // 31. Anfrage muss blockiert werden
    const req = createGetRequest("/api/aktionen/aktion-1", testIp);
    const res = await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toContain("Zu viele Anfragen");
  });

  it("Test 5: Rate-Limit-Fenster läuft ab — neue Anfragen werden wieder erlaubt", async () => {
    const { GET } = await import("@/app/api/aktionen/[id]/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      titel: "Test Aktion",
      wahlkreis: { id: "wk-1", name: "Mitte", nummer: 1 },
      team: null,
      _count: { anmeldungen: 0 },
    });

    const testIp = "192.168.1.50";
    const originalDateNow = Date.now;

    try {
      // Ersten Zeitpunkt setzen
      let mockTime = 1000000;
      Date.now = vi.fn(() => mockTime);

      // 30 Anfragen durchlassen (Limit erreicht)
      for (let i = 0; i < 30; i++) {
        const req = createGetRequest("/api/aktionen/aktion-1", testIp);
        await GET(req as any, { params: Promise.resolve({ id: "aktion-1" }) });
      }

      // 31. blockiert
      const req31 = createGetRequest("/api/aktionen/aktion-1", testIp);
      const res31 = await GET(req31 as any, { params: Promise.resolve({ id: "aktion-1" }) });
      expect(res31.status).toBe(429);

      // Zeit 2 Minuten vorspulen (> RATE_WINDOW = 60 Sekunden)
      mockTime += 2 * 60 * 1000;

      // Jetzt sollte wieder ein Request erlaubt sein
      const reqAfterReset = createGetRequest("/api/aktionen/aktion-1", testIp);
      const resAfterReset = await GET(reqAfterReset as any, {
        params: Promise.resolve({ id: "aktion-1" }),
      });
      expect(resAfterReset.status).not.toBe(429);
    } finally {
      Date.now = originalDateNow;
    }
  });
});
