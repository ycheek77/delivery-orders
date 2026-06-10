import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE  = "auth_token";
const ADMIN_COOKIE = "admin_auth";

// ── Base64url → Uint8Array<ArrayBuffer> (패딩 자동 보완) ────────
function b64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
  const binary = atob(padded);
  // new Uint8Array(n) 은 ArrayBuffer 기반 — crypto.subtle 에 직접 전달 가능
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Web Crypto API(crypto.subtle)로 HS256 JWT 검증
 * jose 없이 Edge Runtime 100% 지원 — 번들 크기 대폭 감소
 */
async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, sigB64] = parts;

    // 만료 시간 확인
    const payloadJson = new TextDecoder().decode(b64urlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    if (
      typeof payload.exp === "number" &&
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    // HMAC-SHA256 서명 검증
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      b64urlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
  } catch {
    return false;
  }
}

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

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // AUTH_SECRET 미설정 — 안전을 위해 /login 으로
    const url = req.nextUrl.clone();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
    }
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  const valid = await verifyJWT(token, secret);
  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "인증이 만료되었습니다." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
