import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getISOWeek, getISOWeekYear } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalAktionen,
    activeAktionen,
    abgesagteAktionen,
    totalAnmeldungen,
    teamCount,
    userCount,
    wahlkreise,
    historicalAggregate,
    archivedByWahlkreis,
    pastAktionen,
    upcomingAktionen,
    teams,
    archivedByTeam,
    liveAktionenForKW,
    archivedForKW,
  ] = await Promise.all([
    prisma.aktion.count(),
    prisma.aktion.count({ where: { status: { in: ["AKTIV", "GEAENDERT"] } } }),
    prisma.aktion.count({ where: { status: "ABGESAGT" } }),
    prisma.anmeldung.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.wahlkreis.findMany({
      include: {
        aktionen: {
          include: { _count: { select: { anmeldungen: true } } },
        },
      },
      orderBy: { nummer: "asc" },
    }),
    prisma.aktionStatistik.aggregate({ _sum: { anmeldungenCount: true } }),
    prisma.aktionStatistik.groupBy({
      by: ["wahlkreisId"],
      _sum: { anmeldungenCount: true },
    }),
    prisma.aktion.count({ where: { datum: { lt: today } } }),
    prisma.aktion.count({ where: { datum: { gte: today } } }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { aktionen: true } },
        aktionen: { select: { _count: { select: { anmeldungen: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.aktionStatistik.groupBy({
      by: ["teamId"],
      _sum: { anmeldungenCount: true },
      _count: { _all: true },
    }),
    prisma.aktion.findMany({
      select: { datum: true, anmeldungen: { select: { id: true } } },
    }),
    prisma.aktionStatistik.findMany({
      select: { aktionDatum: true, anmeldungenCount: true },
    }),
  ]);

  const historicalSum = historicalAggregate._sum.anmeldungenCount ?? 0;
  const archivedMap = new Map(
    archivedByWahlkreis.map((r) => [r.wahlkreisId, r._sum.anmeldungenCount ?? 0])
  );

  const anmeldungenByWahlkreis = wahlkreise.map((wk) => ({
    wahlkreis: wk.name,
    nummer: wk.nummer,
    count:
      wk.aktionen.reduce((sum, a) => sum + a._count.anmeldungen, 0) +
      (archivedMap.get(wk.id) ?? 0),
  }));

  const archivedTeamMap = new Map(
    archivedByTeam
      .filter((r) => r.teamId !== null)
      .map((r) => [
        r.teamId!,
        { staende: r._count._all, anmeldungen: r._sum.anmeldungenCount ?? 0 },
      ])
  );

  const staendeByTeam = teams
    .map((t) => ({
      team: t.name,
      count: t._count.aktionen + (archivedTeamMap.get(t.id)?.staende ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  const anmeldungenByTeam = teams
    .map((t) => ({
      team: t.name,
      count:
        t.aktionen.reduce((sum, a) => sum + a._count.anmeldungen, 0) +
        (archivedTeamMap.get(t.id)?.anmeldungen ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  const kwMap = new Map<
    string,
    { kw: number; year: number; staende: number; anmeldungen: number }
  >();

  for (const a of liveAktionenForKW) {
    const kw = getISOWeek(a.datum);
    const year = getISOWeekYear(a.datum);
    const key = `${year}-${String(kw).padStart(2, "0")}`;
    const existing = kwMap.get(key) ?? { kw, year, staende: 0, anmeldungen: 0 };
    existing.staende += 1;
    existing.anmeldungen += a.anmeldungen.length;
    kwMap.set(key, existing);
  }

  for (const s of archivedForKW) {
    const kw = getISOWeek(s.aktionDatum);
    const year = getISOWeekYear(s.aktionDatum);
    const key = `${year}-${String(kw).padStart(2, "0")}`;
    const existing = kwMap.get(key) ?? { kw, year, staende: 0, anmeldungen: 0 };
    existing.staende += 1;
    existing.anmeldungen += s.anmeldungenCount;
    kwMap.set(key, existing);
  }

  const byKalenderwoche = Array.from(kwMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.kw - b.kw
  );

  return NextResponse.json({
    totalAktionen,
    activeAktionen,
    abgesagteAktionen,
    totalAnmeldungen,
    totalAnmeldungenGesamt: totalAnmeldungen + historicalSum,
    teamCount,
    userCount,
    anmeldungenByWahlkreis,
    pastAktionen,
    upcomingAktionen,
    staendeByTeam,
    anmeldungenByTeam,
    byKalenderwoche,
  });
}
