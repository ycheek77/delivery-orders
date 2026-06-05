import { NextRequest, NextResponse } from "next/server";
import { queryByOrderer } from "@/lib/db";

// GET /api/my-orders?name=홍길동&contact=010-1234-5678
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name")?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    const rows = await queryByOrderer(name);
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
