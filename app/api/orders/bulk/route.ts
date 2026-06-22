import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PRODUCTS } from "@/lib/products";
import { insertOrder } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

function errJson(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
  return NextResponse.json({ error: message }, { status });
}

interface ParsedRow {
  orderer:   string;
  recipient: string;
  address:   string;
  contact:   string;
  product:   string;
  quantity:  number;
  request:   string;
}

export async function POST(req: NextRequest) {
  try {
    // JWT에서 접속 코드 ID 추출
    const auth = await getAuthFromRequest(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) return NextResponse.json({ error: "시트를 찾을 수 없습니다." }, { status: 400 });

    // ── 파싱 & 검증 ──────────────────────────────────────────────
    const parsedRows: ParsedRow[] = [];
    const errors: string[] = [];

    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // 헤더 스킵

      const orderer      = row.getCell(1).text?.trim() ?? "";
      const recipient    = row.getCell(2).text?.trim() ?? "";
      const address      = row.getCell(3).text?.trim() ?? "";
      const contact      = row.getCell(4).text?.trim() ?? "";
      const product      = row.getCell(5).text?.trim() ?? "";
      const quantityText = row.getCell(6).text?.trim() ?? "";
      const request      = row.getCell(7).text?.trim() ?? "";

      // 완전히 빈 행은 건너뜀
      if (!orderer && !recipient && !product) return;

      if (!orderer)   { errors.push(`${rowNum}행: 주문자가 비어 있습니다.`);        return; }
      if (!recipient) { errors.push(`${rowNum}행: 수령인이 비어 있습니다.`);        return; }
      if (!product)   { errors.push(`${rowNum}행: 제품명이 비어 있습니다.`);        return; }

      if (!(PRODUCTS as readonly string[]).includes(product)) {
        errors.push(`${rowNum}행: 허용되지 않는 제품명 — "${product}"`);
        return;
      }

      const quantity = Number(quantityText);
      if (!quantityText || isNaN(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
        errors.push(`${rowNum}행: 수량이 올바르지 않습니다 (입력값: "${quantityText}")`);
        return;
      }

      parsedRows.push({ orderer, recipient, address, contact, product, quantity, request });
    });

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    if (parsedRows.length === 0) {
      return NextResponse.json({ error: "데이터 행이 없습니다." }, { status: 400 });
    }

    // ── 주문자별 그룹핑 ──────────────────────────────────────────
    // orderer → Map<(recipient||contact), { recipient, address, contact, items[] }>
    type RecipientEntry = {
      recipient: string;
      address:   string;
      contact:   string;
      request:   string;
      items:     { product_name: string; quantity: number }[];
    };
    const orderMap = new Map<string, Map<string, RecipientEntry>>();

    for (const row of parsedRows) {
      if (!orderMap.has(row.orderer)) orderMap.set(row.orderer, new Map());
      const recMap = orderMap.get(row.orderer)!;
      const key = `${row.recipient}||${row.contact}`;
      if (!recMap.has(key)) {
        recMap.set(key, {
          recipient: row.recipient,
          address:   row.address,
          contact:   row.contact,
          request:   row.request,
          items:     [],
        });
      } else if (!recMap.get(key)!.request && row.request) {
        // 같은 수령인의 첫 번째 비어있지 않은 요청사항 사용
        recMap.get(key)!.request = row.request;
      }
      recMap.get(key)!.items.push({ product_name: row.product, quantity: row.quantity });
    }

    // ── 주문 저장 (access_code_id는 JWT에서, orderer_name은 엑셀에서) ──
    let created = 0;
    let totalRecipients = 0;
    const saveErrors: string[] = [];

    for (const [ordererName, recMap] of orderMap) {
      const recipients = Array.from(recMap.values()).map((r) => ({
        recipient_name: r.recipient,
        address:        r.address,
        contact:        r.contact,
        request:        r.request,
        items:          r.items,
      }));
      try {
        await insertOrder(auth.sub, ordererName, recipients);
        created++;
        totalRecipients += recipients.length;
      } catch (e) {
        saveErrors.push(
          `주문자 "${ordererName}": ${e instanceof Error ? e.message : "저장 실패"}`
        );
      }
    }

    if (saveErrors.length > 0) {
      return NextResponse.json({ created, totalRecipients, errors: saveErrors }, { status: 207 });
    }

    return NextResponse.json({ created, totalRecipients });
  } catch (e) {
    return errJson(e);
  }
}
