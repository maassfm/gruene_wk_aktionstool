import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";
import { aktionSchema } from "@/lib/validators";
import { geocodeAddress } from "@/lib/geocoding";
import { sendEmail } from "@/lib/email";
import { aenderungsEmail, absageEmail } from "@/lib/email-templates";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Rate limiting for public GET endpoint (SEC-05)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max requests per minute for detail endpoint
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." },
      { status: 429 }
    );
  }

  const { id } = await params;

  const aktion = await prisma.aktion.findUnique({
    where: { id },
    include: {
      wahlkreis: true,
      team: true,
      _count: { select: { anmeldungen: true } },
    },
  });

  if (!aktion) {
    return NextResponse.json({ error: "Aktion nicht gefunden" }, { status: 404 });
  }

  const session = await auth();
  if (!session) {
    const { ansprechpersonEmail: _, ansprechpersonTelefon: __, ...publicAktion } = aktion;
    return NextResponse.json(publicAktion);
  }

  return NextResponse.json(aktion);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.aktion.findUnique({
    where: { id },
    include: { anmeldungen: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Aktion nicht gefunden" }, { status: 404 });
  }

  // Check team access for experts (also allow if user created the action without a team)
  if (session.user.role === "EXPERT") {
    const inTeam = existing.teamId != null && session.user.teamIds?.includes(existing.teamId);
    const isCreator = existing.createdById === session.user.id;
    if (!inTeam && !isCreator) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const validated = aktionSchema.parse(body);

    let latitude = validated.latitude;
    let longitude = validated.longitude;
    if (validated.adresse !== existing.adresse && (!latitude || !longitude)) {
      const geo = await geocodeAddress(validated.adresse);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }

    // Track changes for notification
    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    if (validated.datum !== format(existing.datum, "yyyy-MM-dd")) {
      changes.push({
        field: "Datum",
        oldValue: format(existing.datum, "d. MMMM yyyy", { locale: de }),
        newValue: format(new Date(validated.datum), "d. MMMM yyyy", { locale: de }),
      });
    }
    if (validated.startzeit !== existing.startzeit) {
      changes.push({ field: "Startzeit", oldValue: existing.startzeit, newValue: validated.startzeit });
    }
    if (validated.endzeit !== existing.endzeit) {
      changes.push({ field: "Endzeit", oldValue: existing.endzeit, newValue: validated.endzeit });
    }
    if (validated.adresse !== existing.adresse) {
      changes.push({ field: "Adresse", oldValue: existing.adresse, newValue: validated.adresse });
    }

    // Allow admin to reassign team
    const newTeamId =
      session.user.role === "ADMIN" && body.teamId ? body.teamId : undefined;

    const aktion = await prisma.aktion.update({
      where: { id },
      data: {
        titel: validated.titel,
        datum: new Date(validated.datum),
        startzeit: validated.startzeit,
        endzeit: validated.endzeit,
        adresse: validated.adresse,
        latitude,
        longitude,
        wahlkreisId: validated.wahlkreisId,
        ansprechpersonName: validated.ansprechpersonName,
        ansprechpersonEmail: validated.ansprechpersonEmail,
        ansprechpersonTelefon: validated.ansprechpersonTelefon,
        maxTeilnehmer: validated.maxTeilnehmer || null,
        status: changes.length > 0 ? "GEAENDERT" : existing.status,
        ...(newTeamId ? { teamId: newTeamId } : {}),
      },
      include: { wahlkreis: true },
    });

    // Send change notification to all registrants
    if (changes.length > 0 && existing.anmeldungen.length > 0) {
      for (const anmeldung of existing.anmeldungen) {
        const emailData = aenderungsEmail(
          {
            titel: aktion.titel,
            datum: aktion.datum,
            startzeit: aktion.startzeit,
            endzeit: aktion.endzeit,
            adresse: aktion.adresse,
            ansprechpersonName: aktion.ansprechpersonName,
            ansprechpersonEmail: aktion.ansprechpersonEmail,
            ansprechpersonTelefon: aktion.ansprechpersonTelefon,
          },
          changes,
          anmeldung.cancelToken ?? undefined
        );
        await sendEmail({
          to: anmeldung.email,
          subject: emailData.subject,
          html: emailData.html,
          typ: "AENDERUNG",
          aktionId: aktion.id,
        });
      }
    }

    return NextResponse.json(aktion);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstMessage = error.issues[0]?.message ?? "Validierungsfehler";
      return NextResponse.json({ error: firstMessage, details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

// DELETE: Cancel action
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.aktion.findUnique({
    where: { id },
    include: { anmeldungen: true },
    // createdById is a scalar field – included automatically
  });

  if (!existing) {
    return NextResponse.json({ error: "Aktion nicht gefunden" }, { status: 404 });
  }

  if (session.user.role === "EXPERT") {
    const inTeam = existing.teamId != null && session.user.teamIds?.includes(existing.teamId);
    const isCreator = existing.createdById === session.user.id;
    if (!inTeam && !isCreator) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  await prisma.aktion.update({
    where: { id },
    data: { status: "ABGESAGT" },
  });

  // Send cancellation email to all registrants
  if (existing.anmeldungen.length > 0) {
    const emailData = absageEmail({
      titel: existing.titel,
      datum: existing.datum,
      startzeit: existing.startzeit,
      endzeit: existing.endzeit,
      adresse: existing.adresse,
      ansprechpersonName: existing.ansprechpersonName,
      ansprechpersonEmail: existing.ansprechpersonEmail,
      ansprechpersonTelefon: existing.ansprechpersonTelefon,
    });

    for (const anmeldung of existing.anmeldungen) {
      await sendEmail({
        to: anmeldung.email,
        subject: emailData.subject,
        html: emailData.html,
        typ: "ABSAGE",
        aktionId: existing.id,
      });
    }
  }

  return NextResponse.json({ message: "Aktion abgesagt" });
}
