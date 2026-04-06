import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function computeDeletionThreshold(datum: Date, endzeit: string): Date {
  const parts = endzeit.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Ungültiges endzeit-Format: ${endzeit}`);
  }

  const end = new Date(datum);
  end.setUTCHours(hours, minutes, 0, 0);
  return new Date(end.getTime() + 72 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const aktionenToClean = await prisma.aktion.findMany({
    where: {
      anmeldungen: { some: {} },
      statistik: null,
    },
    select: {
      id: true,
      datum: true,
      endzeit: true,
      wahlkreisId: true,
      teamId: true,
      _count: { select: { anmeldungen: true } },
    },
  });

  const now = new Date();
  const eligible = aktionenToClean.filter((a) => {
    try {
      return computeDeletionThreshold(a.datum, a.endzeit) <= now;
    } catch {
      return false;
    }
  });

  let processed = 0;
  let deleted = 0;
  const errors: string[] = [];

  for (const aktion of eligible) {
    try {
      await prisma.$transaction(async (tx) => {
        const count = await tx.anmeldung.count({ where: { aktionId: aktion.id } });

        await tx.aktionStatistik.create({
          data: {
            aktionId: aktion.id,
            anmeldungenCount: count,
            aktionDatum: aktion.datum,
            wahlkreisId: aktion.wahlkreisId,
            teamId: aktion.teamId ?? null,
          },
        });

        await tx.anmeldung.deleteMany({ where: { aktionId: aktion.id } });
      });

      processed++;
      deleted += aktion._count.anmeldungen;
    } catch {
      errors.push(aktion.id);
    }
  }

  return NextResponse.json({
    message: `${processed} Aktionen bereinigt, ${deleted} Anmeldungen gelöscht`,
    processed,
    deleted,
    errors,
  });
}
