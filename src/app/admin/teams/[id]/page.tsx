"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";

interface Wahlkreis {
  id: string;
  nummer: number;
  name: string;
}

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [wahlkreise, setWahlkreise] = useState<Wahlkreis[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    wahlkreisId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/wahlkreise").then((r) => r.json()),
    ]).then(([teams, wk]) => {
      const team = teams.find((t: { id: string; name: string; wahlkreis: { id: string } | null }) => t.id === id);
      if (team) {
        setForm({
          name: team.name,
          wahlkreisId: team.wahlkreis?.id ?? "",
        });
      }
      setWahlkreise(wk);
      setFetchLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/teams", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: form.name, wahlkreisId: form.wahlkreisId || null }),
    });

    if (res.ok) {
      router.push("/admin/teams");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Speichern");
    }

    setLoading(false);
  }

  if (fetchLoading) {
    return <div className="text-gray-500">Lade Team...</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Team bearbeiten
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Team-Daten ändern</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Teamname"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
          <Select
            label="Wahlkreis (optional)"
            value={form.wahlkreisId}
            onChange={(e) => setForm({ ...form, wahlkreisId: e.target.value })}
            options={wahlkreise.map((w) => ({ value: w.id, label: `Wahlkreis ${w.nummer}: ${w.name}` }))}
            placeholder="– Bezirksweit –"
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
