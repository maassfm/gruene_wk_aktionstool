import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { meineAktionenEmail } from "@/lib/email-templates";

// Rate limiting: 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

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

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
      { status: 429 }
    );
  }

  const emailParam = req.nextUrl.searchParams.get("email");
  const parsed = z.string().email().safeParse(emailParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }
  const email = parsed.data;

  try {
    const anmeldungen = await prisma.anmeldung.findMany({
      where: { email },
      include: { aktion: true },
      orderBy: { aktion: { datum: "asc" } },
    });

    const aktionen = anmeldungen.map((a) => ({
      titel: a.aktion.titel,
      datum: a.aktion.datum,
      startzeit: a.aktion.startzeit,
      endzeit: a.aktion.endzeit,
      adresse: a.aktion.adresse,
      ansprechpersonName: a.aktion.ansprechpersonName,
      ansprechpersonEmail: a.aktion.ansprechpersonEmail,
      ansprechpersonTelefon: a.aktion.ansprechpersonTelefon,
      cancelToken: a.cancelToken ?? undefined,
    }));

    const emailData = meineAktionenEmail(aktionen);

    await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      typ: "BESTAETIGUNG",
    });

    return NextResponse.json({ message: "E-Mail wurde gesendet" });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
