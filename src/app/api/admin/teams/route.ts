import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    include: {
      wahlkreis: true,
      _count: { select: { members: true, aktionen: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = teamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        name: validated.name,
        wahlkreisId: validated.wahlkreisId || null,
      },
      include: { wahlkreis: true },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validierungsfehler", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, wahlkreisId } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID und Name erforderlich" }, { status: 400 });
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        wahlkreisId: wahlkreisId || null,
      },
      include: { wahlkreis: true },
    });

    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
  }

  // Check if team has users or aktionen
  const team = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { members: true, aktionen: true } } },
  });

  if (team && (team._count.members > 0 || team._count.aktionen > 0)) {
    return NextResponse.json(
      { error: "Team kann nicht gelöscht werden, da es noch Mitglieder oder Aktionen hat." },
      { status: 400 }
    );
  }

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ message: "Team gelöscht" });
}
