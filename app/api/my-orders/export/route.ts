import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { queryByAccessCodeId } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

// GET /api/my-orders/export — 본인 주문 엑셀 다운로드 (JWT 기반)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const rows = await queryByAccessCodeId(auth.sub);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("내주문내역");

    ws.columns = [
      { header: "주문자",   key: "orderer",   width: 14 },
      { header: "수령인",   key: "recipient", width: 14 },
      { header: "주소",     key: "address",   width: 48 },
      { header: "연락처",   key: "contact",   width: 18 },
      { header: "제품명",   key: "product",   width: 36 },
      { header: "수량",     key: "quantity",  width: 8  },
      { header: "요청사항", key: "request",   width: 28 },
      { header: "송장번호", key: "tracking",  width: 20 },
    ];

    // 헤더 스타일
    ws.getRow(1).eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    ws.getRow(1).height = 28;

    for (const r of rows) {
      ws.addRow({
        orderer:   r.orderer_name,
        recipient: r.recipient_name,
        address:   r.address,
        contact:   r.contact,
        product:   r.products,
        quantity:  "",
        request:   r.request,
        tracking:  r.tracking_number,
      });
    }

    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
      .format(new Date())
      .replace(/-/g, "");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(Buffer.from(await wb.xlsx.writeBuffer()) as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          `내주문내역_${today}.xlsx`
        )}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
