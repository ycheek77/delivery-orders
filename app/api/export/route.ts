import { NextRequest, NextResponse } from "next/server";
import { queryRowsAsc } from "@/lib/db";
import { buildExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;

  const rows = queryRowsAsc(date);
  const buffer = await buildExcel(rows);
  const filename = date ? `orders_${date}.xlsx` : `orders_all.xlsx`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
