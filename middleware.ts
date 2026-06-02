import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login 은 보호 제외
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token !== "1") {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
