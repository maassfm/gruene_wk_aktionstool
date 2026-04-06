"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";

interface Team {
  id: string;
  name: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EXPERT",
    teamIds: [] as string[],
  });

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then(setTeams);
  }, []);

  function toggleTeam(teamId: string) {
    setForm((f) => ({
      ...f,
      teamIds: f.teamIds.includes(teamId)
        ? f.teamIds.filter((id) => id !== teamId)
        : [...f.teamIds, teamId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/users");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Erstellen");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Neue*r Benutzer*in
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Benutzer*in anlegen</CardTitle>
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
          <Input
            label="Initiales Passwort"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teams
            </label>
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Teams vorhanden</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Erstellen
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
