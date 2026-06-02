import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { updateTrackingNumbers } from "@/lib/db";
import { buildTrackingTemplate } from "@/lib/excel";

// GET /api/tracking  → 빈 템플릿 다운로드
export async function GET() {
  const buffer = await buildTrackingTemplate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("송장번호_입력양식.xlsx")}`,
    },
  });
}

// POST /api/tracking  body: FormData { file: xlsx }
// 컬럼 순서: 수령인명(1) / 주소(2) / 연락처(3) / 제품및수량(4) / 주문자명(5) / 송장번호입력(6)
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any); // ExcelJS Buffer 타입과 @types/node 20 + TS 5.6+ 불일치
  const ws = wb.worksheets[0];
  if (!ws) return NextResponse.json({ error: "시트를 찾을 수 없습니다." }, { status: 400 });

  const rows: { name: string; contact: string; tracking_number: string }[] = [];

  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // 헤더 스킵
    const name     = row.getCell(1).text?.trim() ?? "";
    const contact  = row.getCell(3).text?.trim() ?? "";
    const tracking = row.getCell(6).text?.trim() ?? "";
    if (name && contact && tracking) {
      rows.push({ name, contact, tracking_number: tracking });
    }
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "송장번호가 입력된 행이 없습니다." }, { status: 400 });
  }

  const count = await updateTrackingNumbers(rows);
  return NextResponse.json({ count });
}
