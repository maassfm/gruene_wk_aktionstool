/**
 * Sicherheitstests: JWT-Invalidierung bei User-Deaktivierung (SEC-04)
 *
 * Prüft, dass deaktivierte Nutzer innerhalb von 5 Minuten den Zugang verlieren.
 * Tests laufen gegen den jwt-Callback der NextAuth-Konfiguration.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// DB-Mock muss vor dem Importieren von auth gesetzt sein
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// next-auth muss gemockt werden, damit der Import von auth.ts keine Initialisierung startet
vi.mock("next-auth", () => {
  let capturedCallbacks: Record<string, Function> = {};
  return {
    default: vi.fn((config: { callbacks?: Record<string, Function> }) => {
      if (config?.callbacks) {
        capturedCallbacks = config.callbacks;
      }
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
        __capturedCallbacks: capturedCallbacks,
      };
    }),
    __getCapturedCallbacks: () => capturedCallbacks,
  };
});

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ id: "credentials", type: "credentials" })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// Hilfsfunktion: jwt-Callback aus der auth-Konfiguration extrahieren
async function getJwtCallback() {
  // next-auth mock neu aufsetzen, damit capturedCallbacks befüllt wird
  const nextAuthModule = await import("next-auth");
  // @ts-expect-error: Mock-interne Hilfsfunktion
  const NextAuth = nextAuthModule.default;

  let capturedCallbacks: Record<string, Function> = {};
  (NextAuth as ReturnType<typeof vi.fn>).mockImplementation(
    (config: { callbacks?: Record<string, Function> }) => {
      if (config?.callbacks) {
        capturedCallbacks = config.callbacks;
      }
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
      };
    }
  );

  // auth.ts laden — löst NextAuth(...) aus, capturedCallbacks wird befüllt
  await import("@/lib/auth");

  return capturedCallbacks.jwt as (args: {
    token: Record<string, unknown>;
    user?: Record<string, unknown>;
  }) => Promise<Record<string, unknown> | null>;
}

describe("JWT-Callback: lastChecked und User-Deaktivierung (SEC-04)", () => {
  it("Test 1: Wenn token.lastChecked undefined ist (Legacy-Token), wird DB-Check sofort ausgeführt und lastChecked gesetzt", async () => {
    const jwt = await getJwtCallback();
    const { prisma } = await import("@/lib/db");

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      active: true,
    });

    const token: Record<string, unknown> = {
      sub: "user-1",
      // lastChecked absichtlich nicht gesetzt (Legacy-Token)
    };

    const result = await jwt({ token });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { active: true },
    });
    expect(result).not.toBeNull();
    expect(typeof (result as Record<string, unknown>).lastChecked).toBe("number");
  });

  it("Test 2: Wenn lastChecked weniger als 5 Minuten alt ist, wird kein DB-Check durchgeführt", async () => {
    const jwt = await getJwtCallback();
    const { prisma } = await import("@/lib/db");

    const recentTimestamp = Date.now() - 2 * 60 * 1000; // vor 2 Minuten
    const token: Record<string, unknown> = {
      sub: "user-1",
      lastChecked: recentTimestamp,
    };

    const result = await jwt({ token });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result).toEqual(token); // Token unverändert zurückgegeben
  });

  it("Test 3: Wenn lastChecked mehr als 5 Minuten alt ist und user.active === true, wird lastChecked aktualisiert", async () => {
    const jwt = await getJwtCallback();
    const { prisma } = await import("@/lib/db");

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      active: true,
    });

    const oldTimestamp = Date.now() - 6 * 60 * 1000; // vor 6 Minuten
    const token: Record<string, unknown> = {
      sub: "user-1",
      lastChecked: oldTimestamp,
    };

    const before = Date.now();
    const result = await jwt({ token });
    const after = Date.now();

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(result).not.toBeNull();
    const updatedTimestamp = (result as Record<string, unknown>).lastChecked as number;
    expect(updatedTimestamp).toBeGreaterThanOrEqual(before);
    expect(updatedTimestamp).toBeLessThanOrEqual(after);
  });

  it("Test 4: Wenn lastChecked mehr als 5 Minuten alt ist und user.active === false, wird null zurückgegeben", async () => {
    const jwt = await getJwtCallback();
    const { prisma } = await import("@/lib/db");

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      active: false,
    });

    const oldTimestamp = Date.now() - 6 * 60 * 1000;
    const token: Record<string, unknown> = {
      sub: "user-1",
      lastChecked: oldTimestamp,
    };

    const result = await jwt({ token });

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("Test 5: Wenn lastChecked mehr als 5 Minuten alt ist und User nicht in DB gefunden wird, wird null zurückgegeben", async () => {
    const jwt = await getJwtCallback();
    const { prisma } = await import("@/lib/db");

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const oldTimestamp = Date.now() - 6 * 60 * 1000;
    const token: Record<string, unknown> = {
      sub: "user-1",
      lastChecked: oldTimestamp,
    };

    const result = await jwt({ token });

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
