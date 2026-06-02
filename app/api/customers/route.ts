import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { searchCustomers, getAllCustomers, upsertCustomers, deleteCustomer } from "@/lib/db";

function errJson(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
  return NextResponse.json({ error: message }, { status });
}

// GET /api/customers          → 전체 목록 (관리자)
// GET /api/customers?q=이름   → 이름 검색 (자동완성)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (q !== null) {
      return NextResponse.json(await searchCustomers(q));
    }
    return NextResponse.json(await getAllCustomers());
  } catch (e) {
    return errJson(e);
  }
}

// POST /api/customers  body: FormData { file: xlsx }
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) {
      return NextResponse.json({ error: "시트를 찾을 수 없습니다." }, { status: 400 });
    }

    const list: { name: string; contact: string; address: string; company: string }[] = [];
    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const name    = row.getCell(1).text?.trim() ?? "";
      const contact = row.getCell(2).text?.trim() ?? "";
      const address = row.getCell(3).text?.trim() ?? "";
      const company = row.getCell(4).text?.trim() ?? "";
      if (name) list.push({ name, contact, address, company });
    });

    const count = await upsertCustomers(list);
    return NextResponse.json({ count });
  } catch (e) {
    return errJson(e);
  }
}

// DELETE /api/customers?id=숫자
export async function DELETE(req: NextRequest) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id 없음" }, { status: 400 });
    const ok = await deleteCustomer(id);
    return NextResponse.json({ ok });
  } catch (e) {
    return errJson(e);
  }
}
