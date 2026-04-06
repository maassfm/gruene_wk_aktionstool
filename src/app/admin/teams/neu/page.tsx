"use client";

import { useEffect, useState } from "react";
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

export default function NewTeamPage() {
  const router = useRouter();
  const [wahlkreise, setWahlkreise] = useState<Wahlkreis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", wahlkreisId: "" });

  useEffect(() => {
    fetch("/api/wahlkreise")
      .then((r) => r.json())
      .then(setWahlkreise);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/teams");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Erstellen");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Neues Team
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Team anlegen</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Teamname"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Wahlkreis (optional)"
            value={form.wahlkreisId}
            onChange={(e) => setForm({ ...form, wahlkreisId: e.target.value })}
            options={wahlkreise.map((wk) => ({
              value: wk.id,
              label: `${wk.nummer}: ${wk.name}`,
            }))}
            placeholder="– Bezirksweit –"
          />

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
