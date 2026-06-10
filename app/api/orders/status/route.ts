import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";

const VALID_STATUSES = ["접수", "처리중", "발송완료", "취소"];

// PATCH /api/orders/status
// body: { orderId: number; status: string }
// 관리자 전용 — 미들웨어가 /admin/* 만 보호하므로 쿠키 직접 확인
export async function PATCH(req: NextRequest) {
  try {
    // 관리자 인증 확인
    const token = req.cookies.get("admin_auth")?.value;
    if (token !== "1") {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body   = await req.json();
    const orderId = Number(body?.orderId);
    const status  = String(body?.status ?? "").trim();

    if (!orderId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 파라미터" }, { status: 400 });
    }

    await updateOrderStatus(orderId, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
