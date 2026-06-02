import { NextRequest, NextResponse } from "next/server";
import { queryByOrderer } from "@/lib/db";

// GET /api/my-orders?name=홍길동&contact=010-1234-5678
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name    = searchParams.get("name")?.trim()    ?? "";
  const contact = searchParams.get("contact")?.trim() ?? "";

  if (!name || !contact) {
    return NextResponse.json({ error: "이름과 연락처를 모두 입력해주세요." }, { status: 400 });
  }

  const rows = await queryByOrderer(name, contact);
  // 결과가 0건이어도 빈 배열 반환 (에러 노출 최소화)
  return NextResponse.json(rows);
}
