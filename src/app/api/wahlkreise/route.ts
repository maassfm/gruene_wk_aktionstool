import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const wahlkreise = await prisma.wahlkreis.findMany({
    orderBy: { nummer: "asc" },
  });
  return NextResponse.json(wahlkreise);
}
