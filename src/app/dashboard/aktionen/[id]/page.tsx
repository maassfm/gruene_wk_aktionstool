"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";

interface Wahlkreis {
  id: string;
  nummer: number;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function EditAktionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const [wahlkreise, setWahlkreise] = useState<Wahlkreis[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titel: "",
    datum: "",
    startzeit: "",
    endzeit: "",
    adresse: "",
    wahlkreisId: "",
    teamId: "",
    ansprechpersonName: "",
    ansprechpersonEmail: "",
    ansprechpersonTelefon: "",
    maxTeilnehmer: "",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/aktionen/${id}`).then((r) => r.json()),
      fetch("/api/wahlkreise").then((r) => r.json()),
      isAdmin ? fetch("/api/admin/teams").then((r) => r.json()) : Promise.resolve([]),
    ]).then(([aktion, wk, tm]) => {
      setWahlkreise(wk);
      setTeams(tm);
      setForm({
        titel: aktion.titel,
        datum: aktion.datum.split("T")[0],
        startzeit: aktion.startzeit,
        endzeit: aktion.endzeit,
        adresse: aktion.adresse,
        wahlkreisId: aktion.wahlkreisId,
        teamId: aktion.teamId,
        ansprechpersonName: aktion.ansprechpersonName,
        ansprechpersonEmail: aktion.ansprechpersonEmail,
        ansprechpersonTelefon: aktion.ansprechpersonTelefon,
        maxTeilnehmer: aktion.maxTeilnehmer?.toString() || "",
      });
      setLoading(false);
    });
  }, [id, isAdmin]);

  function updateForm(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...form,
      maxTeilnehmer: form.maxTeilnehmer ? parseInt(form.maxTeilnehmer) : null,
    };

    const res = await fetch(`/api/aktionen/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Speichern");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-gray-500">Lade Aktion...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Aktion bearbeiten
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{form.titel}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titel"
            value={form.titel}
            onChange={(e) => updateForm("titel", e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Datum"
              type="date"
              value={form.datum}
              onChange={(e) => updateForm("datum", e.target.value)}
              required
            />
            <Input
              label="Startzeit"
              type="time"
              value={form.startzeit}
              onChange={(e) => updateForm("startzeit", e.target.value)}
              required
            />
            <Input
              label="Endzeit"
              type="time"
              value={form.endzeit}
              onChange={(e) => updateForm("endzeit", e.target.value)}
              required
            />
          </div>

          <Input
            label="Adresse"
            value={form.adresse}
            onChange={(e) => updateForm("adresse", e.target.value)}
            required
          />

          <Select
            label="Wahlkreis"
            value={form.wahlkreisId}
            onChange={(e) => updateForm("wahlkreisId", e.target.value)}
            options={wahlkreise.map((wk) => ({
              value: wk.id,
              label: `${wk.nummer}: ${wk.name}`,
            }))}
          />

          {isAdmin && teams.length > 0 && (
            <Select
              label="Team"
              value={form.teamId}
              onChange={(e) => updateForm("teamId", e.target.value)}
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
            />
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-bold text-gray-700 mb-3">Ansprechperson</h3>
            <div className="space-y-4">
              <Input
                label="Name"
                value={form.ansprechpersonName}
                onChange={(e) => updateForm("ansprechpersonName", e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="E-Mail"
                  type="email"
                  value={form.ansprechpersonEmail}
                  onChange={(e) => updateForm("ansprechpersonEmail", e.target.value)}
                  required
                />
                <Input
                  label="Telefon"
                  type="tel"
                  value={form.ansprechpersonTelefon}
                  onChange={(e) => updateForm("ansprechpersonTelefon", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Input
            label="Max. Teilnehmer (optional)"
            type="number"
            value={form.maxTeilnehmer}
            onChange={(e) => updateForm("maxTeilnehmer", e.target.value)}
            min="1"
            placeholder="Unbegrenzt"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={saving}>
              Änderungen speichern
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
