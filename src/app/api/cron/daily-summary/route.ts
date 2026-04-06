import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { tagesUebersichtEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const dayAfterTomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));

  // Find all registrations from today
  const todaysAnmeldungen = await prisma.anmeldung.findMany({
    where: {
      createdAt: {
        gte: todayUTC,
        lt: tomorrowUTC,
      },
    },
    include: {
      aktion: true,
    },
  });

  // Find all active actions happening tomorrow
  const aktionenMorgen = await prisma.aktion.findMany({
    where: {
      datum: { gte: tomorrowUTC, lt: dayAfterTomorrowUTC },
      status: { in: ["AKTIV", "GEAENDERT"] },
    },
    include: { anmeldungen: true },
  });

  // Find today's self-cancellations via EmailLog
  const todaysAbmeldungen = await prisma.emailLog.findMany({
    where: {
      typ: "ABMELDUNG",
      gesendetAm: {
        gte: todayUTC,
        lt: tomorrowUTC,
      },
    },
    include: {
      aktion: { select: { titel: true, datum: true, ansprechpersonEmail: true, ansprechpersonName: true } },
    },
  });

  if (todaysAnmeldungen.length === 0 && aktionenMorgen.length === 0 && todaysAbmeldungen.length === 0) {
    return NextResponse.json({ message: "Keine neuen Anmeldungen und keine Aktionen morgen" });
  }

  // Group by ansprechpersonEmail
  const byAnsprechperson = new Map<
    string,
    {
      name: string;
      aktionen: Map<string, { titel: string; datum: Date; startzeit: string; anmeldungen: typeof todaysAnmeldungen }>;
      aktionenMorgen: { titel: string; datum: Date; startzeit: string; endzeit: string; adresse: string; anmeldungen: { vorname: string; nachname: string; email: string; telefon: string | null; signalName: string | null }[] }[];
      abmeldungen: { vorname: string; nachname: string; aktionTitel: string; aktionDatum: Date }[];
    }
  >();

  for (const anmeldung of todaysAnmeldungen) {
    const { ansprechpersonEmail: email, ansprechpersonName: name } = anmeldung.aktion;

    if (!byAnsprechperson.has(email)) {
      byAnsprechperson.set(email, { name, aktionen: new Map(), aktionenMorgen: [], abmeldungen: [] });
    }

    const entry = byAnsprechperson.get(email)!;
    if (!entry.aktionen.has(anmeldung.aktionId)) {
      entry.aktionen.set(anmeldung.aktionId, {
        titel: anmeldung.aktion.titel,
        datum: anmeldung.aktion.datum,
        startzeit: anmeldung.aktion.startzeit,
        anmeldungen: [],
      });
    }

    entry.aktionen.get(anmeldung.aktionId)!.anmeldungen.push(anmeldung);
  }

  // Add tomorrow's actions to the map
  for (const aktion of aktionenMorgen) {
    const { ansprechpersonEmail: email, ansprechpersonName: name } = aktion;

    if (!byAnsprechperson.has(email)) {
      byAnsprechperson.set(email, { name, aktionen: new Map(), aktionenMorgen: [], abmeldungen: [] });
    }

    byAnsprechperson.get(email)!.aktionenMorgen.push({
      titel: aktion.titel,
      datum: aktion.datum,
      startzeit: aktion.startzeit,
      endzeit: aktion.endzeit,
      adresse: aktion.adresse,
      anmeldungen: aktion.anmeldungen.map((an: { vorname: string; nachname: string; email: string; telefon: string | null; signalName: string | null }) => ({
        vorname: an.vorname,
        nachname: an.nachname,
        email: an.email,
        telefon: an.telefon,
        signalName: an.signalName,
      })),
    });
  }

  // Add today's cancellations to the map
  for (const log of todaysAbmeldungen) {
    if (!log.aktion) continue; // aktion was deleted

    const { ansprechpersonEmail: email, ansprechpersonName: name } = log.aktion;

    if (!byAnsprechperson.has(email)) {
      byAnsprechperson.set(email, { name, aktionen: new Map(), aktionenMorgen: [], abmeldungen: [] });
    }

    // Parse "ABMELDUNG: Vorname Nachname" from status field
    const nameParts = log.status.replace("ABMELDUNG: ", "").split(" ");
    const vorname = nameParts[0] || "";
    const nachname = nameParts.slice(1).join(" ") || "";

    byAnsprechperson.get(email)!.abmeldungen.push({
      vorname,
      nachname,
      aktionTitel: log.aktion.titel,
      aktionDatum: log.aktion.datum,
    });
  }

  const randomDelay = () =>
    new Promise<void>((resolve) =>
      setTimeout(resolve, 25_000 + Math.random() * 20_000)
    );

  // Send one email per Ansprechperson
  let emailsSent = 0;
  let first = true;

  for (const [email, { name, aktionen, aktionenMorgen: morgenList, abmeldungen }] of byAnsprechperson) {
    if (!first) await randomDelay();
    first = false;
    const aktionenList = Array.from(aktionen.values()).map((a) => ({
      titel: a.titel,
      datum: a.datum,
      startzeit: a.startzeit,
      anmeldungen: a.anmeldungen.map((an: { vorname: string; nachname: string; email: string; telefon: string | null; signalName: string | null }) => ({
        vorname: an.vorname,
        nachname: an.nachname,
        email: an.email,
        telefon: an.telefon,
        signalName: an.signalName,
      })),
    }));

    const emailData = tagesUebersichtEmail(name, todayUTC, aktionenList, morgenList, abmeldungen);
    await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      typ: "TAEGLICHE_UEBERSICHT",
    });
    emailsSent++;
  }

  return NextResponse.json({
    message: `${emailsSent} E-Mail(s) gesendet`,
    anmeldungen: todaysAnmeldungen.length,
    aktionenMorgen: aktionenMorgen.length,
    abmeldungen: todaysAbmeldungen.length,
  });
}
