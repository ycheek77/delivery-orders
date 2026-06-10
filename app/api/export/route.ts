import { NextRequest, NextResponse } from "next/server";
import { queryRowsAsc, updateOrdersStatus } from "@/lib/db";
import { buildExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;

  const allRows = await queryRowsAsc(date);

  // 취소된 주문은 엑셀에서 제외
  const rows = allRows.filter((r) => r.status !== "취소");

  const buffer = await buildExcel(rows);
  const filename = date ? `orders_${date}.xlsx` : `orders_all.xlsx`;

  // 엑셀 다운로드 시 '접수' 상태 주문을 '처리중'으로 자동 전환
  try {
    const acceptedIds = [
      ...new Set(
        rows
          .filter((r) => r.status === "접수" && r.order_id > 0)
          .map((r) => r.order_id)
      ),
    ];
    if (acceptedIds.length > 0) {
      await updateOrdersStatus(acceptedIds, "처리중");
    }
  } catch {
    // 상태 업데이트 실패는 무시 (파일은 정상 제공)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
