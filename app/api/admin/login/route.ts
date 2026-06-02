import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_auth";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "1236";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== PASSWORD) {
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
