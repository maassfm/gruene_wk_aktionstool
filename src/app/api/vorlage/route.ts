import { NextResponse } from "next/server";
import { createVorlageExcel } from "@/lib/excel";

export async function GET() {
  const buffer = await createVorlageExcel();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="aktionen-vorlage.xlsx"',
    },
  });
}
