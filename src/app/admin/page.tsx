"use client";

import { useEffect, useState } from "react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Stats {
  totalAktionen: number;
  totalAnmeldungenGesamt?: number;
  totalAnmeldungen?: number;
  pastAktionen: number;
  upcomingAktionen: number;
  abgesagteAktionen?: number;
  anmeldungenByWahlkreis?: { wahlkreis: string; nummer: number; count: number }[];
  staendeByTeam?: { team: string; count: number }[];
  anmeldungenByTeam?: { team: string; count: number }[];
  byKalenderwoche?: { kw: number; year: number; staende: number; anmeldungen: number }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Statistiken...</div>
      </div>
    );
  }

  function handleExport() {
    window.location.href = "/api/admin/export-stats";
  }

  const anmeldungenByWahlkreis = stats.anmeldungenByWahlkreis ?? [];
  const staendeByTeam = stats.staendeByTeam ?? [];
  const anmeldungenByTeam = stats.anmeldungenByTeam ?? [];
  const byKalenderwoche = stats.byKalenderwoche ?? [];

  const maxAnmeldungenWK = Math.max(...anmeldungenByWahlkreis.map((w) => w.count), 1);
  const maxStaendeTeam = Math.max(...staendeByTeam.map((t) => t.count), 1);
  const maxAnmeldungenTeam = Math.max(...anmeldungenByTeam.map((t) => t.count), 1);
  const maxStaendeKW = Math.max(...byKalenderwoche.map((k) => k.staende), 1);
  const maxAnmeldungenKW = Math.max(...byKalenderwoche.map((k) => k.anmeldungen), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-tanne uppercase mb-3">
          Gesamtübersicht
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleExport()}>Auswertung exportieren</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Aktionen gesamt" value={stats.totalAktionen} icon="📋" />
        <StatCard
          label="Anmeldungen gesamt"
          value={stats.totalAnmeldungenGesamt ?? stats.totalAnmeldungen ?? 0}
          icon="👥"
        />
        <StatCard
          label="Bevorstehende Veranstaltungen"
          value={stats.upcomingAktionen}
          icon="🗓️"
        />
        <StatCard
          label="Vergangene Veranstaltungen"
          value={stats.pastAktionen}
          icon="📅"
        />
        <StatCard
          label="Abgesagte Veranstaltungen"
          value={stats.abgesagteAktionen ?? 0}
          icon="🚫"
        />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Anmeldungen nach Wahlkreis</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {anmeldungenByWahlkreis.map((item) => (
              <div key={item.nummer} className="flex items-center gap-3">
                <span className="text-sm font-bold text-tanne w-6">
                  {item.nummer}
                </span>
                <span className="text-sm text-gray-600 w-40">{item.wahlkreis}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-klee h-full rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${Math.max(
                        (item.count / maxAnmeldungenWK) * 100,
                        item.count > 0 ? 10 : 0
                      )}%`,
                    }}
                  >
                    <span className="text-xs text-white font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stände nach Team</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {staendeByTeam.map((item) => (
              <div key={item.team} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40 shrink-0 truncate">
                  {item.team}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-grashalm h-full rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${Math.max(
                        (item.count / maxStaendeTeam) * 100,
                        item.count > 0 ? 10 : 0
                      )}%`,
                    }}
                  >
                    <span className="text-xs text-white font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anmeldungen nach Team</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {anmeldungenByTeam.map((item) => (
              <div key={item.team} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40 shrink-0 truncate">
                  {item.team}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-himmel h-full rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${Math.max(
                        (item.count / maxAnmeldungenTeam) * 100,
                        item.count > 0 ? 10 : 0
                      )}%`,
                    }}
                  >
                    <span className="text-xs text-white font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stände nach Kalenderwoche</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {byKalenderwoche.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Daten vorhanden.</p>
            ) : (
              byKalenderwoche.map((item) => (
                <div
                  key={`${item.year}-${item.kw}`}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-bold text-tanne w-16 shrink-0">
                    KW {String(item.kw).padStart(2, "0")}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-tanne h-full rounded-full flex items-center justify-end px-2"
                      style={{
                        width: `${Math.max(
                          (item.staende / maxStaendeKW) * 100,
                          item.staende > 0 ? 10 : 0
                        )}%`,
                      }}
                    >
                      <span className="text-xs text-white font-bold">
                        {item.staende}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anmeldungen nach Kalenderwoche</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {byKalenderwoche.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Daten vorhanden.</p>
            ) : (
              byKalenderwoche.map((item) => (
                <div
                  key={`${item.year}-${item.kw}`}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-bold text-tanne w-16 shrink-0">
                    KW {String(item.kw).padStart(2, "0")}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-klee h-full rounded-full flex items-center justify-end px-2"
                      style={{
                        width: `${Math.max(
                          (item.anmeldungen / maxAnmeldungenKW) * 100,
                          item.anmeldungen > 0 ? 10 : 0
                        )}%`,
                      }}
                    >
                      <span className="text-xs text-white font-bold">
                        {item.anmeldungen}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-tanne">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}
