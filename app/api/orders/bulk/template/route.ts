import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PRODUCTS } from "@/lib/products";

export async function GET() {
  try {
    const wb = new ExcelJS.Workbook();

    // ── 1. 주문 입력 시트 ────────────────────────────────────────
    const ws = wb.addWorksheet("일괄주문입력");
    ws.columns = [
      { header: "주문자",  key: "orderer",   width: 14 },
      { header: "수령인",  key: "recipient", width: 14 },
      { header: "주소",    key: "address",   width: 48 },
      { header: "연락처",  key: "contact",   width: 18 },
      { header: "제품명",  key: "product",   width: 28 },
      { header: "수량",    key: "quantity",  width: 8  },
    ];

    ws.getRow(1).eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    ws.getRow(1).height = 28;

    // 예시 행 (노란 배경)
    const examples = [
      { orderer: "김주문", recipient: "홍길동", address: "서울시 강남구 테헤란로 123",      contact: "010-1234-5678", product: "설포유 프라임 포뮬러",  quantity: 2 },
      { orderer: "김주문", recipient: "홍길동", address: "서울시 강남구 테헤란로 123",      contact: "010-1234-5678", product: "슬립B",               quantity: 1 },
      { orderer: "김주문", recipient: "이영희", address: "경기도 수원시 팔달구 행궁로 1",   contact: "010-9876-5432", product: "세로타민",             quantity: 1 },
      { orderer: "박주문", recipient: "최민수", address: "부산시 해운대구 해운대해변로 264", contact: "010-1111-2222", product: "슬립B",               quantity: 3 },
    ];
    examples.forEach((ex) => {
      const r = ws.addRow(ex);
      r.eachCell((cell) => {
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9C4" } };
        cell.font      = { italic: true, color: { argb: "FF9E9E9E" } };
        cell.alignment = { vertical: "middle" };
      });
    });

    // ── 2. 제품명 컬럼 드롭다운 유효성 검사 (E2:E500) ────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ws as any).dataValidations.add("E2:E500", {
      type:             "list",
      allowBlank:       true,
      // Excel list formula: 쌍따옴표로 감싼 쉼표-구분 문자열
      formulae:         [`"${PRODUCTS.join(",")}"`],
      showErrorMessage: true,
      errorStyle:       "stop",
      errorTitle:       "허용되지 않는 제품명",
      error:            "드롭다운 목록에서 제품을 선택해주세요.",
      showInputMessage: true,
      promptTitle:      "제품명 선택",
      prompt:           "드롭다운에서 제품을 선택하세요.",
    });

    // ── 3. 허용 제품 목록 시트 ─────────────────────────────────
    const ws2 = wb.addWorksheet("허용제품목록_참고");
    ws2.getColumn(1).width = 30;
    const titleRow = ws2.addRow(["허용 제품명 (정확히 입력하세요)"]);
    titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
    titleRow.getCell(1).alignment = { horizontal: "center" };
    titleRow.height = 24;
    PRODUCTS.forEach((p) => ws2.addRow([p]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(Buffer.from(await wb.xlsx.writeBuffer()) as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("일괄주문_템플릿.xlsx")}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return Response.json({ error: msg }, { status: 500 });
  }
}
