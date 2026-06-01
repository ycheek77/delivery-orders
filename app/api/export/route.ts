import { NextRequest, NextResponse } from "next/server";
import { queryRowsAsc } from "@/lib/db";
import { buildExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;

  const rows = queryRowsAsc(date);
  const buffer = await buildExcel(rows);
  const filename = date ? `orders_${date}.xlsx` : `orders_all.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
