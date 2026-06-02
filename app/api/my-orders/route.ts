import { NextRequest, NextResponse } from "next/server";
import { queryByOrderer } from "@/lib/db";

// GET /api/my-orders?name=홍길동&contact=010-1234-5678
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name    = searchParams.get("name")?.trim()    ?? "";
    const contact = searchParams.get("contact")?.trim() ?? "";

    if (!name || !contact) {
      return NextResponse.json({ error: "이름과 연락처를 모두 입력해주세요." }, { status: 400 });
    }

    const rows = await queryByOrderer(name, contact);
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
