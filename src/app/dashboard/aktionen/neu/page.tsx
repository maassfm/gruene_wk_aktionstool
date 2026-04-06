"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import ExcelUpload from "@/components/ExcelUpload";

interface Wahlkreis {
  id: string;
  nummer: number;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function NewAktionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [wahlkreise, setWahlkreise] = useState<Wahlkreis[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"manual" | "excel">("manual");

  const [form, setForm] = useState({
    titel: "",
    datum: "",
    startzeit: "",
    endzeit: "",
    adresse: "",
    wahlkreisId: "",
    ansprechpersonName: "",
    ansprechpersonEmail: "",
    ansprechpersonTelefon: "",
    maxTeilnehmer: "",
    teamId: "",
  });

  useEffect(() => {
    fetch("/api/wahlkreise")
      .then((r) => r.json())
      .then(setWahlkreise);
  }, []);

  useEffect(() => {
    if (!session) return;
    const teamIds = session.user.teamIds ?? [];
    if (teamIds.length <= 1) return; // No need to fetch if 0 or 1 team

    fetch("/api/user/teams")
      .then((r) => r.json())
      .then((teams: Team[]) => setUserTeams(teams));
  }, [session]);

  function updateForm(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const teamIds = session?.user.teamIds ?? [];
    const selectedTeamId =
      form.teamId ||
      (teamIds.length === 1 ? teamIds[0] : undefined);

    const body = {
      ...form,
      teamId: selectedTeamId,
      maxTeilnehmer: form.maxTeilnehmer ? parseInt(form.maxTeilnehmer) : null,
    };

    const res = await fetch("/api/aktionen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Erstellen");
    }
    setLoading(false);
  }

  const teamIds = session?.user.teamIds ?? [];
  const isAdmin = session?.user.role === "ADMIN";
  const needsTeamSelect = isAdmin || teamIds.length > 1;

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-6">
        Neue Aktion
      </h1>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("manual")}
          className={`px-4 py-2 font-bold text-sm uppercase tracking-wide border-2 border-black transition-all ${
            tab === "manual"
              ? "bg-tanne text-white shadow-[2px_2px_0_#000]"
              : "bg-white text-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
          }`}
        >
          Manuell anlegen
        </button>
        <button
          onClick={() => setTab("excel")}
          className={`px-4 py-2 font-bold text-sm uppercase tracking-wide border-2 border-black transition-all ${
            tab === "excel"
              ? "bg-tanne text-white shadow-[2px_2px_0_#000]"
              : "bg-white text-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
          }`}
        >
          Excel-Import
        </button>
      </div>

      {tab === "manual" ? (
        <Card>
          <CardHeader>
            <CardTitle>Aktion anlegen</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Titel"
              value={form.titel}
              onChange={(e) => updateForm("titel", e.target.value)}
              required
              placeholder="z.B. Infostand Alexanderplatz"
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
              placeholder="Straße Nr., PLZ Berlin"
            />

            <Select
              label="Wahlkreis"
              value={form.wahlkreisId}
              onChange={(e) => updateForm("wahlkreisId", e.target.value)}
              options={wahlkreise.map((wk) => ({
                value: wk.id,
                label: `${wk.nummer}: ${wk.name}`,
              }))}
              placeholder="Bitte wählen"
            />

            {needsTeamSelect && userTeams.length > 0 && (
              <Select
                label="Team"
                value={form.teamId}
                onChange={(e) => updateForm("teamId", e.target.value)}
                options={userTeams.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Bitte Team wählen"
              />
            )}

            <div className="border-t-2 border-black pt-4 mt-4">
              <h3 className="font-headline font-bold uppercase tracking-wide text-black mb-3">Ansprechperson</h3>
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
              <div className="border-2 border-black bg-red-50 text-red-600 p-3 text-sm shadow-[2px_2px_0_#000]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                Aktion erstellen
              </Button>
              <Button variant="ghost" type="button" onClick={() => router.back()}>
                Abbrechen
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <ExcelUpload userTeams={userTeams} needsTeamSelect={needsTeamSelect} />
      )}
    </div>
  );
}
