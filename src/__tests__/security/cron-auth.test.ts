/**
 * Sicherheitstests: Cron-Endpunkt-Authentifizierung
 *
 * Der Cron-Endpunkt /api/cron/daily-summary sendet tägliche Übersichten
 * mit persönlichen Daten (Namen, E-Mails, Telefonnummern) per E-Mail.
 * Er muss durch ein Bearer-Token geschützt sein.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    anmeldung: {
      findMany: vi.fn(),
    },
    aktion: {
      findMany: vi.fn(),
    },
    emailLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email-templates", () => ({
  tagesUebersichtEmail: vi.fn(() => ({ subject: "", html: "" })),
}));

const CRON_SECRET = "test-cron-secret-12345";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", CRON_SECRET);
});

describe("Cron-Endpunkt-Schutz", () => {
  it("Ohne Authorization-Header → 401", async () => {
    const { POST } = await import("@/app/api/cron/daily-summary/route");

    const req = new Request("http://localhost:3000/api/cron/daily-summary", {
      method: "POST",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("Mit falschem Bearer-Token → 401", async () => {
    const { POST } = await import("@/app/api/cron/daily-summary/route");

    const req = new Request("http://localhost:3000/api/cron/daily-summary", {
      method: "POST",
      headers: {
        Authorization: "Bearer falscher-token",
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("Mit korrektem Bearer-Token → Zugriff erlaubt", async () => {
    const { POST } = await import("@/app/api/cron/daily-summary/route");
    const { prisma } = await import("@/lib/db");

    (prisma.anmeldung.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.aktion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.emailLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new Request("http://localhost:3000/api/cron/daily-summary", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });

  it("Bearer-Prefix fehlt → 401", async () => {
    const { POST } = await import("@/app/api/cron/daily-summary/route");

    const req = new Request("http://localhost:3000/api/cron/daily-summary", {
      method: "POST",
      headers: {
        Authorization: CRON_SECRET, // Ohne "Bearer " Prefix
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});
