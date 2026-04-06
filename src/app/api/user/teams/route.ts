import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userTeams = await prisma.userTeam.findMany({
    where: { userId: session.user.id },
    include: { team: { select: { id: true, name: true } } },
  });

  return NextResponse.json(userTeams.map((ut) => ut.team));
}
