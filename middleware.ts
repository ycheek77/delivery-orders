import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE  = "auth_token";
const ADMIN_COOKIE = "admin_auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 관리자 쿠키 보유 시 모든 경로 허용 (admin_auth 기반 인증)
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (adminToken === "1") return NextResponse.next();

  // 2. 공개 경로 — 인증 불필요
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/admin/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 3. 관리자 경로 — admin_auth 없으면 /admin/login 으로
  if (pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // 4. 그 외 모든 경로 — JWT(auth_token) 검증
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "인증이 만료되었습니다." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
