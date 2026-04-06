import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAktionenExcel, createAktionenTxt } from "@/lib/excel";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("format") || "xlsx";
  const teamId = searchParams.get("teamId");
  const dateFilter = searchParams.get("dateFilter");
  const activeOnly = searchParams.get("activeOnly") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (session.user.role === "EXPERT" && session.user.teamIds?.length > 0) {
    where.teamId = { in: session.user.teamIds };
  } else if (teamId) {
    where.teamId = teamId;
  }

  // Datums-Filter auf Prisma anwenden
  const now = new Date();
  if (dateFilter === "heute") {
    where.datum = {
      gte: startOfDay(now),
      lte: endOfDay(now),
    };
  } else if (dateFilter === "morgen") {
    const tomorrow = addDays(now, 1);
    where.datum = {
      gte: startOfDay(tomorrow),
      lte: endOfDay(tomorrow),
    };
  } else if (dateFilter === "woche") {
    // weekStartsOn: 1 -> Montag
    where.datum = {
      gte: startOfWeek(now, { weekStartsOn: 1 }),
      lte: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }

  // Status-Filter auf Prisma anwenden
  if (activeOnly) {
    where.status = { in: ["AKTIV", "GEAENDERT"] };
  }

  const aktionen = await prisma.aktion.findMany({
    where,
    include: {
      wahlkreis: true,
      team: true,
      _count: { select: { anmeldungen: true } },
    },
    orderBy: { datum: "asc" },
  });

  const exportData = aktionen.map((a) => ({
    titel: a.titel,
    datum: format(a.datum, "dd.MM.yyyy", { locale: de }),
    datumMitTag: format(a.datum, "dd.MM.yyyy (EEE)", { locale: de }),
    startzeit: a.startzeit,
    endzeit: a.endzeit,
    adresse: a.adresse,
    wahlkreis: `WK ${a.wahlkreis.nummer} – ${a.wahlkreis.name}`,
    team: a.team?.name ?? "",
    status: a.status,
    anmeldungen: a._count.anmeldungen,
    maxTeilnehmer: a.maxTeilnehmer,
    ansprechpersonName: a.ansprechpersonName,
  }));

  if (exportFormat === "txt") {
    const txt = createAktionenTxt(exportData);
    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="aktionen.txt"`,
      },
    });
  }

  const buffer = await createAktionenExcel(exportData);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="aktionen.xlsx"`,
    },
  });
}