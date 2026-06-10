import { NextRequest, NextResponse } from "next/server";
import { insertOrder, queryRows } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

function errJson(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // JWT에서 접속 코드 ID와 사용자명 추출
    const auth = await getAuthFromRequest(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const { recipients } = body;

    if (!recipients?.length) {
      return NextResponse.json({ error: "수령인 정보를 입력해주세요." }, { status: 400 });
    }

    const id = await insertOrder(auth.sub, auth.name, recipients);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return errJson(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    return NextResponse.json(await queryRows(date));
  } catch (e) {
    return errJson(e);
  }
}
