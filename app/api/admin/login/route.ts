import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_auth";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    // ADMIN_PASSWORD 환경변수 미설정 — 안전을 위해 로그인 거부
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const { password } = await req.json();
  if (password !== adminPassword) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 24시간 유지
    maxAge: 60 * 60 * 24,
  });
  return res;
}
