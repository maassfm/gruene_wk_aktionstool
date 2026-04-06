"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";

interface WahlkreisDetail {
  id: string;
  nummer: number;
  name: string;
  _count: { teams: number; aktionen: number };
}

export default function EditWahlkreisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    nummer: "",
  });
  const [counts, setCounts] = useState({ teams: 0, aktionen: 0 });

  useEffect(() => {
    fetch("/api/admin/wahlkreise")
      .then((r) => r.json())
      .then((data: WahlkreisDetail[]) => {
        const wk = data.find((w) => w.id === id);
        if (wk) {
          setForm({ name: wk.name, nummer: String(wk.nummer) });
          setCounts(wk._count);
        }
        setFetchLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const nummerInt = parseInt(form.nummer, 10);
    if (isNaN(nummerInt) || nummerInt < 1) {
      setError("Nummer muss eine positive ganze Zahl sein");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/wahlkreise", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: form.name, nummer: nummerInt }),
    });

    if (res.ok) {
      router.push("/admin/wahlkreise");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Speichern");
    }

    setLoading(false);
  }

  if (fetchLoading) {
    return <div className="text-gray-500">Lade Wahlkreis...</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Wahlkreis bearbeiten
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Wahlkreis-Daten ändern</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nummer"
            type="number"
            value={form.nummer}
            onChange={(e) => setForm({ ...form, nummer: e.target.value })}
            required
            min={1}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />

          <div className="text-sm text-gray-600 border-t-2 border-black pt-3">
            <span className="mr-4">👥 {counts.teams} Teams</span>
            <span>📋 {counts.aktionen} Aktionen</span>
          </div>

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
