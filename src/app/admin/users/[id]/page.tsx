"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  teams: Team[];
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "EXPERT",
    active: true,
    teamIds: [] as string[],
    newPassword: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/teams").then((r) => r.json()),
    ]).then(([users, teams]: [User[], Team[]]) => {
      const user = users.find((u: User) => u.id === id);
      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          teamIds: user.teams.map((t) => t.id),
          newPassword: "",
        });
      }
      setAllTeams(teams);
      setFetchLoading(false);
    });
  }, [id]);

  function toggleTeam(teamId: string) {
    setForm((f) => ({
      ...f,
      teamIds: f.teamIds.includes(teamId)
        ? f.teamIds.filter((tid) => tid !== teamId)
        : [...f.teamIds, teamId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = {
      id,
      name: form.name,
      email: form.email,
      role: form.role,
      active: form.active,
      teamIds: form.teamIds,
    };
    if (form.newPassword) {
      payload.password = form.newPassword;
    }

    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/users");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Speichern");
    }

    setLoading(false);
  }

  if (fetchLoading) {
    return <div className="text-gray-500">Lade Daten...</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Benutzer*in bearbeiten
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Daten ändern</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="E-Mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Select
            label="Rolle"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: "EXPERT", label: "Expert*in" },
              { value: "ADMIN", label: "Admin" },
            ]}
          />
          <Select
            label="Status"
            value={form.active ? "active" : "inactive"}
            onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
            options={[
              { value: "active", label: "Aktiv" },
              { value: "inactive", label: "Inaktiv" },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teams
            </label>
            {allTeams.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Teams vorhanden</p>
            ) : (
              <div className="space-y-2">
                {allTeams.map((team) => (
                  <label key={team.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.teamIds.includes(team.id)}
                      onChange={() => toggleTeam(team.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{team.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Neues Passwort (leer lassen = unverändert)"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            minLength={8}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Speichern
            </Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
