import { NextRequest, NextResponse } from "next/server";
import { queryByAccessCodeId } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

// GET /api/my-orders — JWT의 access_code_id 기준으로 본인 주문 조회
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const rows = await queryByAccessCodeId(auth.sub);
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
