import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const baseUrl =
  process.env.NEXTAUTH_URL ?? "https://aktionen.gruene-mitte.de";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/abmeldung?fehler=1", baseUrl));
  }

  try {
    const anmeldung = await prisma.anmeldung.findUnique({
      where: { cancelToken: token },
      select: {
        id: true,
        aktionId: true,
        vorname: true,
        nachname: true,
        email: true,
        cancelToken: true,
      },
    });

    if (!anmeldung) {
      return NextResponse.redirect(new URL("/abmeldung?fehler=1", baseUrl));
    }

    await prisma.anmeldung.delete({ where: { cancelToken: token } });

    // Log cancellation for daily summary (per D-10)
    await prisma.emailLog.create({
      data: {
        typ: "ABMELDUNG",
        empfaengerEmail: anmeldung.email,
        aktionId: anmeldung.aktionId,
        status: `ABMELDUNG: ${anmeldung.vorname} ${anmeldung.nachname}`,
      },
    });

    return NextResponse.redirect(new URL("/abmeldung", baseUrl));
  } catch {
    return NextResponse.redirect(new URL("/abmeldung?fehler=1", baseUrl));
  }
}
