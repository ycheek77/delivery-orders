import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

// POST /api/orders/cancel  body: { orderId: number }
// JWT 쿠키의 access_code_id로 본인 주문인지 검증 후 취소
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const orderId = Number(body?.orderId);

    if (!orderId) {
      return NextResponse.json({ error: "주문 ID가 필요합니다." }, { status: 400 });
    }

    const result = await cancelOrder(orderId, auth.sub);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
