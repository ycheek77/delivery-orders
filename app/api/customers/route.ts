import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { searchCustomers, getAllCustomers, upsertCustomers, deleteCustomer } from "@/lib/db";

// GET /api/customers          → 전체 목록 (관리자)
// GET /api/customers?q=이름   → 이름 검색 (자동완성)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (q !== null) {
    return NextResponse.json(searchCustomers(q));
  }
  return NextResponse.json(getAllCustomers());
}

// POST /api/customers  body: FormData { file: xlsx }
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any); // ExcelJS Buffer 타입과 @types/node 20 + TS 5.6+ 불일치
  const ws = wb.worksheets[0];
  if (!ws) {
    return NextResponse.json({ error: "시트를 찾을 수 없습니다." }, { status: 400 });
  }

  const list: { name: string; contact: string; address: string; company: string }[] = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // 헤더 건너뜀
    const name    = row.getCell(1).text?.trim() ?? "";
    const contact = row.getCell(2).text?.trim() ?? "";
    const address = row.getCell(3).text?.trim() ?? "";
    const company = row.getCell(4).text?.trim() ?? "";
    if (name) list.push({ name, contact, address, company });
  });

  const count = upsertCustomers(list);
  return NextResponse.json({ count });
}

// DELETE /api/customers?id=숫자
export async function DELETE(req: NextRequest) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id 없음" }, { status: 400 });
  const ok = deleteCustomer(id);
  return NextResponse.json({ ok });
}
