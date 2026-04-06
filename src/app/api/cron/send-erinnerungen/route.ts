import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { erinnerungsEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Determine "tomorrow" in Berlin local time.
  // The cron runs at 17:00 UTC (= 19:00 CEST / 18:00 CET).
  // We compute tomorrow's date boundaries in the Europe/Berlin timezone so
  // that datum comparisons match the local calendar date stored in the DB.
  const now = new Date();
  const berlinFormatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = berlinFormatter.formatToParts(now);
  const berlinDay = Number(parts.find((p) => p.type === "day")!.value);
  const berlinMonth = Number(parts.find((p) => p.type === "month")!.value) - 1;
  const berlinYear = Number(parts.find((p) => p.type === "year")!.value);

  // Midnight UTC for tomorrow and day-after-tomorrow in Berlin local time
  const tomorrowBerlinStart = new Date(Date.UTC(berlinYear, berlinMonth, berlinDay + 1));
  const dayAfterBerlinStart = new Date(Date.UTC(berlinYear, berlinMonth, berlinDay + 2));

  // Find all registrations for active actions happening tomorrow
  const anmeldungen = await prisma.anmeldung.findMany({
    where: {
      aktion: {
        datum: { gte: tomorrowBerlinStart, lt: dayAfterBerlinStart },
        status: { in: ["AKTIV", "GEAENDERT"] },
      },
    },
    include: { aktion: true },
  });

  if (anmeldungen.length === 0) {
    return NextResponse.json({ message: "Keine Anmeldungen für morgen", emailsSent: 0 });
  }

  // Group by volunteer email – one person may be registered for several actions tomorrow
  const byEmail = new Map<
    string,
    {
      vorname: string;
      aktionen: {
        titel: string;
        datum: Date;
        startzeit: string;
        endzeit: string;
        adresse: string;
        ansprechpersonName: string;
        ansprechpersonEmail: string;
        ansprechpersonTelefon: string;
        cancelToken: string | null;
      }[];
    }
  >();

  for (const anmeldung of anmeldungen) {
    const { email, vorname, cancelToken, aktion } = anmeldung;

    if (!byEmail.has(email)) {
      byEmail.set(email, { vorname, aktionen: [] });
    }

    byEmail.get(email)!.aktionen.push({
      titel: aktion.titel,
      datum: aktion.datum,
      startzeit: aktion.startzeit,
      endzeit: aktion.endzeit,
      adresse: aktion.adresse,
      ansprechpersonName: aktion.ansprechpersonName,
      ansprechpersonEmail: aktion.ansprechpersonEmail,
      ansprechpersonTelefon: aktion.ansprechpersonTelefon,
      cancelToken,
    });
  }

  const randomDelay = () =>
    new Promise<void>((resolve) =>
      setTimeout(resolve, 25_000 + Math.random() * 20_000)
    );

  // Send one reminder email per volunteer
  let emailsSent = 0;
  let first = true;

  for (const [email, { vorname, aktionen }] of byEmail) {
    if (!first) await randomDelay();
    first = false;
    const emailData = erinnerungsEmail(vorname, aktionen);
    await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      typ: "ERINNERUNG",
    });
    emailsSent++;
  }

  return NextResponse.json({
    message: `${emailsSent} Erinnerungs-E-Mail(s) gesendet`,
    emailsSent,
    anmeldungen: anmeldungen.length,
  });
}
