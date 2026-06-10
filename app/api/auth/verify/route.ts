import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signAuthToken } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** 같은 IP에서 10분 내 5회 이상 실패 시 true */
async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", since);
  return (count ?? 0) >= 5;
}

async function recordFailure(ip: string) {
  await supabase
    .from("login_attempts")
    .insert({ ip, attempted_at: new Date().toISOString() });
}

// POST /api/auth/verify  body: { code: string }
export async function POST(req: NextRequest) {
  try {
    // IP 추출 (프록시/CDN 고려)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // 브루트포스 차단
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: "너무 많은 시도입니다. 10분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim();

    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: "4자리 숫자 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 코드 조회 (service_role — RLS 우회)
    const { data, error } = await supabase
      .from("access_codes")
      .select("id, user_name, is_active")
      .eq("code", code)
      .single();

    if (error || !data) {
      await recordFailure(ip);
      return NextResponse.json(
        { error: "코드가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (!data.is_active) {
      await recordFailure(ip);
      return NextResponse.json(
        { error: "비활성화된 코드입니다." },
        { status: 401 }
      );
    }

    // 마지막 사용 시각 갱신 (실패 무시)
    supabase
      .from("access_codes")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then(() => {});

    // JWT 발급
    const token = await signAuthToken(data.id, data.user_name);

    const res = NextResponse.json({ ok: true, userName: data.user_name });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24, // 24시간
      path:     "/",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
