import { vi } from "vitest";

// Typ-Definitionen für Mock-Sessions
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EXPERT";
    teamId: string | null;
    teamIds?: string[];
  };
}

// Vordefinierte Test-Sessions
export const ADMIN_SESSION: MockSession = {
  user: {
    id: "admin-1",
    name: "Admin User",
    email: "admin@test.de",
    role: "ADMIN",
    teamId: "team-1",
  },
};

export const EXPERT_TEAM_A: MockSession = {
  user: {
    id: "expert-a",
    name: "Expert A",
    email: "expert-a@test.de",
    role: "EXPERT",
    teamId: "team-a",
    teamIds: ["team-a"],
  },
};

export const EXPERT_TEAM_B: MockSession = {
  user: {
    id: "expert-b",
    name: "Expert B",
    email: "expert-b@test.de",
    role: "EXPERT",
    teamId: "team-b",
    teamIds: ["team-b"],
  },
};

// Hilfsfunktion: auth()-Mock setzen
// Muss async sein, weil wir dynamic import verwenden (path alias)
export async function mockAuth(session: MockSession | null) {
  const { auth } = await import("@/lib/auth");
  (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(session);
}

// Hilfsfunktion: NextRequest erstellen
export function createRequest(
  url: string,
  options?: RequestInit
): Request {
  return new Request(`http://localhost:3000${url}`, options);
}

// Hilfsfunktion: JSON-Body-Request erstellen
export function createJsonRequest(
  url: string,
  body: unknown,
  method = "POST"
): Request {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
