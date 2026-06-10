import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/db";

// POST /api/orders/cancel
// body: { orderId: number; ordererName: string }
// 주문자 본인이 '접수' 상태 주문만 취소 가능
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId     = Number(body?.orderId);
    const ordererName = String(body?.ordererName ?? "").trim();

    if (!orderId || !ordererName) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    const result = await cancelOrder(orderId, ordererName);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
