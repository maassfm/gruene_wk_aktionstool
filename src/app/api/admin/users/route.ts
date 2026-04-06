import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userSchema, userUpdateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    include: { teams: { include: { team: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sanitized = users.map(({ password: _, ...user }) => ({
    ...user,
    teams: user.teams.map((ut) => ut.team),
  }));
  return NextResponse.json(sanitized);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = userSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        teams: {
          create: (validated.teamIds ?? []).map((teamId) => ({ teamId })),
        },
      },
      include: { teams: { include: { team: true } } },
    });

    const { password: _, ...sanitized } = user;
    return NextResponse.json(
      { ...sanitized, teams: sanitized.teams.map((ut) => ut.team) },
      { status: 201 }
    );
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
    const validated = userUpdateSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.role !== undefined) updateData.role = validated.role;
    if (validated.active !== undefined) updateData.active = validated.active;
    if (validated.password !== undefined) updateData.password = await bcrypt.hash(validated.password, 12);

    // Update teams if provided
    if (validated.teamIds !== undefined) {
      updateData.teams = {
        deleteMany: {},
        create: validated.teamIds.map((teamId: string) => ({ teamId })),
      };
    }

    const user = await prisma.user.update({
      where: { id: validated.id },
      data: updateData,
      include: { teams: { include: { team: true } } },
    });

    const { password: _, ...sanitized } = user;
    return NextResponse.json({ ...sanitized, teams: sanitized.teams.map((ut) => ut.team) });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validierungsfehler", details: error }, { status: 400 });
    }
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

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Benutzer gelöscht" });
}
