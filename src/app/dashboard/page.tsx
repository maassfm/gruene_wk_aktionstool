"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { de } from "date-fns/locale";

interface Aktion {
  id: string;
  titel: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  adresse: string;
  status: string;
  wahlkreis: { nummer: number; name: string };
  team: { name: string } | null;
  _count: { anmeldungen: number };
  maxTeilnehmer: number | null;
}

export default function DashboardPage() {
  const [aktionen, setAktionen] = useState<Aktion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState<"alle" | "heute" | "morgen" | "woche">("alle");
  const [activeOnly, setActiveOnly] = useState(false);
  const [hidePast, setHidePast] = useState(true);

  useEffect(() => {
    fetch("/api/aktionen")
      .then((r) => r.json())
      .then((data) => {
        setAktionen(data);
        setLoading(false);
      });
  }, []);

  function handleCancel(id: string) {
    setCancelId(id);
  }

  async function confirmCancel() {
    if (!cancelId) return;
    const id = cancelId;
    setCancelId(null);
    const res = await fetch(`/api/aktionen/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAktionen(aktionen.map((a) => (a.id === id ? { ...a, status: "ABGESAGT" } : a)));
    }
  }

  // Aktionen filtern
  const filteredAktionen = aktionen.filter((a) => {
    // Status Filter
    if (activeOnly && a.status === "ABGESAGT") return false;

    // Vergangene ausblenden (älter als 1 Tag)
    if (hidePast) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(0, 0, 0, 0);
      if (new Date(a.datum) < cutoff) return false;
    }

    // Datums Filter
    const date = new Date(a.datum);
    if (dateFilter === "heute" && !isToday(date)) return false;
    if (dateFilter === "morgen" && !isTomorrow(date)) return false;
    // weekStartsOn: 1 setzt Montag als ersten Tag der Woche
    if (dateFilter === "woche" && !isThisWeek(date, { weekStartsOn: 1 })) return false;

    return true;
  });

  // Export-URL Parameter aufbauen
  const exportParams = new URLSearchParams();
  if (dateFilter !== "alle") exportParams.set("dateFilter", dateFilter);
  if (activeOnly) exportParams.set("activeOnly", "true");
  const exportQuery = exportParams.toString() ? `&${exportParams.toString()}` : "";

  if (loading) {
    return <div className="text-gray-500 p-8">Lade Aktionen...</div>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline text-2xl font-bold text-tanne uppercase">
          Meine Aktionen
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {filteredAktionen.length > 0 && (
            <>
              <a href={`/api/export-aktionen?format=xlsx${exportQuery}`}>
                <Button variant="outline" size="sm">Excel exportieren</Button>
              </a>
              <a href={`/api/export-aktionen?format=txt${exportQuery}`}>
                <Button variant="outline" size="sm">Signal-Text</Button>
              </a>
            </>
          )}
          <Link href="/dashboard/aktionen/neu">
            <Button>Neue Aktion</Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-6 mb-8 bg-white border-2 border-black p-4 shadow-[4px_4px_0_#000]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold uppercase">Zeitraum:</span>
          <Button
            variant={dateFilter === "alle" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDateFilter("alle")}
          >
            Alle
          </Button>
          <Button
            variant={dateFilter === "heute" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDateFilter("heute")}
          >
            Heute
          </Button>
          <Button
            variant={dateFilter === "morgen" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDateFilter("morgen")}
          >
            Morgen
          </Button>
          <Button
            variant={dateFilter === "woche" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDateFilter("woche")}
          >
            Diese Woche
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-l-2 border-gray-300 pl-6">
          <label className="flex items-center gap-2 text-sm font-bold uppercase cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 accent-tanne cursor-pointer"
            />
            Nur Aktive (Aktiv & Geändert)
          </label>
          <label className="flex items-center gap-2 text-sm font-bold uppercase cursor-pointer">
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => setHidePast(e.target.checked)}
              className="w-4 h-4 accent-tanne cursor-pointer"
            />
            Vergangene ausblenden (älter als 1 Tag)
          </label>
        </div>
      </div>

      {filteredAktionen.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] p-8 text-center text-gray-500">
          <p>Keine Aktionen für diese Filter gefunden.</p>
          {aktionen.length === 0 && (
            <Link href="/dashboard/aktionen/neu" className="text-tanne font-bold hover:underline mt-2 inline-block">
              Erste Aktion anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAktionen.map((aktion) => (
            <div
              key={aktion.id}
              className="bg-white border-2 border-black shadow-[4px_4px_0_#000] p-4"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-headline font-bold text-tanne uppercase tracking-wide">{aktion.titel}</h3>
                    <StatusBadge status={aktion.status} />
                  </div>
                  <div className="text-sm text-black space-y-0.5">
                    <p>
                      📅 {format(new Date(aktion.datum), "EEEE, d. MMMM yyyy", { locale: de })} · {aktion.startzeit} – {aktion.endzeit}
                    </p>
                    <p>📍 {aktion.adresse}</p>
                    {aktion.team && (
                      <p>
                        <span className="text-xs font-bold uppercase tracking-wide bg-black text-white px-2 py-0.5 inline-block mt-1">
                          {aktion.team.name}
                        </span>
                      </p>
                    )}
                    <p className="pt-1">
                      👥 {aktion._count.anmeldungen} Anmeldungen
                      {aktion.maxTeilnehmer ? ` / ${aktion.maxTeilnehmer} Plätze` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 sm:flex-row sm:flex-wrap items-start">
                  <Link href={`/dashboard/aktionen/${aktion.id}/anmeldungen`} className="sm:w-auto self-start">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Anmeldungen
                    </Button>
                  </Link>
                  <div className="flex gap-2 w-full sm:w-auto self-start items-center">
                    <Link href={`/dashboard/aktionen/${aktion.id}`} className="flex-1 sm:flex-none self-start">
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        Bearbeiten
                      </Button>
                    </Link>
                    {aktion.status !== "ABGESAGT" && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-none self-start"
                        onClick={() => handleCancel(aktion.id)}
                      >
                        Absagen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        title="Aktion absagen"
      >
        <p className="mb-6 text-gray-700">
          Aktion wirklich absagen? Alle Angemeldeten werden benachrichtigt.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setCancelId(null)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Absagen
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "AKTIV":
      return <Badge variant="success">Aktiv</Badge>;
    case "GEAENDERT":
      return <Badge variant="warning">Geändert</Badge>;
    case "ABGESAGT":
      return <Badge variant="danger">Abgesagt</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}