import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE: Hard-delete action (admin only, no email notifications)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.aktion.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Aktion nicht gefunden" }, { status: 404 });
  }

  await prisma.aktion.delete({ where: { id } });

  return NextResponse.json({ message: "Aktion gelöscht" });
}
