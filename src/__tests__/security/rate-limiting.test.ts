/**
 * Sicherheitstests: Rate-Limiting
 *
 * Prüft, dass die öffentliche Anmeldungs-API vor Brute-Force-
 * und Spam-Angriffen geschützt ist.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  // Rate-Limit-Map zurücksetzen, indem Modul neu geladen wird
  vi.resetModules();
});

function createAnmeldungRequest(ip: string) {
  return new Request("http://localhost:3000/api/anmeldungen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({
      aktionIds: ["aktion-1"],
      vorname: "Max",
      nachname: "Muster",
      email: "max@test.de",
      telefon: "01711234567",
      datenschutz: true,
    }),
  });
}

describe("Rate-Limiting für öffentliche Anmeldungen", () => {
  it("Erlaubt 10 Anfragen pro IP, blockiert die 11.", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");
    const { prisma } = await import("@/lib/db");

    // Mock: Aktion existiert und ist aktiv
    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      status: "AKTIV",
      maxTeilnehmer: null,
      _count: { anmeldungen: 0 },
    });
    (prisma.anmeldung.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anm-1" });

    const testIp = "192.168.1.100";

    // 10 Anfragen sollten durchgehen
    for (let i = 0; i < 10; i++) {
      const req = createAnmeldungRequest(testIp);
      const res = await POST(req as any);
      expect(res.status).not.toBe(429);
    }

    // 11. Anfrage muss blockiert werden
    const req = createAnmeldungRequest(testIp);
    const res = await POST(req as any);
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toContain("Zu viele Anfragen");
  });

  it("Unterschiedliche IPs werden unabhängig limitiert", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");
    const { prisma } = await import("@/lib/db");

    (prisma.aktion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "aktion-1",
      status: "AKTIV",
      maxTeilnehmer: null,
      _count: { anmeldungen: 0 },
    });
    (prisma.anmeldung.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anm-1" });

    // 10 Anfragen von IP A
    for (let i = 0; i < 10; i++) {
      const req = createAnmeldungRequest("10.0.0.1");
      await POST(req as any);
    }

    // IP B sollte trotzdem funktionieren
    const req = createAnmeldungRequest("10.0.0.2");
    const res = await POST(req as any);
    expect(res.status).not.toBe(429);
  });
});

describe("Honeypot-Schutz gegen Spam-Bots", () => {
  it("Anfrage mit ausgefülltem Honeypot-Feld wird still akzeptiert aber nicht verarbeitet", async () => {
    const { POST } = await import("@/app/api/anmeldungen/route");
    const { prisma } = await import("@/lib/db");

    const req = new Request("http://localhost:3000/api/anmeldungen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.50",
      },
      body: JSON.stringify({
        aktionIds: ["aktion-1"],
        vorname: "Bot",
        nachname: "Spam",
        email: "bot@spam.de",
        telefon: "00000000",
        datenschutz: true,
        honeypot: "Ich bin ein Bot",  // Honeypot ausgefüllt!
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200); // Akzeptiert, aber...

    // ...es wurde NICHTS in die Datenbank geschrieben
    expect(prisma.anmeldung.create).not.toHaveBeenCalled();
  });
});
