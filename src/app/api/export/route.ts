import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAnmeldungenExcel, createAnmeldungenTxt } from "@/lib/excel";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("format") || "xlsx";
  const aktionId = searchParams.get("aktionId");
  const wahlkreisId = searchParams.get("wahlkreisId");
  const teamId = searchParams.get("teamId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (aktionId) {
    where.aktionId = aktionId;
  }

  if (session.user.role === "EXPERT" && session.user.teamIds?.length > 0) {
    where.aktion = { teamId: { in: session.user.teamIds } };
  } else if (teamId) {
    where.aktion = { ...(where.aktion || {}), teamId };
  }

  if (wahlkreisId) {
    where.aktion = { ...(where.aktion || {}), wahlkreisId };
  }

  const anmeldungen = await prisma.anmeldung.findMany({
    where,
    include: { aktion: true },
    orderBy: { createdAt: "desc" },
  });

  const exportData = anmeldungen.map((a) => ({
    vorname: a.vorname,
    nachname: a.nachname,
    email: a.email,
    telefon: a.telefon,
    signalName: a.signalName,
    aktionTitel: a.aktion.titel,
    aktionDatum: format(a.aktion.datum, "dd.MM.yyyy", { locale: de }),
    aktionOrt: a.aktion.adresse,
    aktionDatumMitTag: format(a.aktion.datum, "dd.MM.yy (EEE)", { locale: de }),
    aktionStartzeit: a.aktion.startzeit,
    aktionEndzeit: a.aktion.endzeit,
    aktionAnsprechpersonName: a.aktion.ansprechpersonName,
  }));

  if (exportFormat === "txt") {
    const txt = createAnmeldungenTxt(exportData);
    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="anmeldungen.txt"`,
      },
    });
  }

  const buffer = await createAnmeldungenExcel(exportData);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="anmeldungen.xlsx"`,
    },
  });
}
