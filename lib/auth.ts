import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";

export interface AuthPayload extends JWTPayload {
  sub: string;   // access_code_id (uuid)
  name: string;  // user_name
}

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!);
}

/** JWT 발급 — access_code_id를 sub, user_name을 name으로 담아 24시간 유효 */
export async function signAuthToken(
  accessCodeId: string,
  userName: string
): Promise<string> {
  return new SignJWT({ name: userName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(accessCodeId)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret());
}

/** JWT 검증 — 성공 시 payload 반환, 실패 시 null */
export async function verifyAuthToken(
  token: string
): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

/** Request의 auth_token 쿠키에서 인증 정보 추출 */
export async function getAuthFromRequest(
  req: NextRequest
): Promise<AuthPayload | null> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
