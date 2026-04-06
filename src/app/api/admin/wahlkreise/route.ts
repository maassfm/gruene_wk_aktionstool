import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { wahlkreisUpdateSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const wahlkreise = await prisma.wahlkreis.findMany({
    include: {
      _count: { select: { teams: true, aktionen: true } },
    },
    orderBy: { nummer: "asc" },
  });

  return NextResponse.json(wahlkreise);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = wahlkreisUpdateSchema.parse(body);

    const wahlkreis = await prisma.wahlkreis.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        nummer: validated.nummer,
      },
    });

    return NextResponse.json(wahlkreis);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validierungsfehler", details: error }, { status: 400 });
    }
    // Prisma unique constraint violation (doppelte Nummer)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Diese Wahlkreisnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
