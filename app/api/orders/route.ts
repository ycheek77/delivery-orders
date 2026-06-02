import { NextRequest, NextResponse } from "next/server";
import { insertOrder, queryRows } from "@/lib/db";
import type { OrderInput } from "@/types/order";

function errJson(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderInput = await req.json();
    const { orderer_name, orderer_contact, recipients } = body;

    if (!orderer_name || !recipients?.length) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
    }

    const id = await insertOrder(orderer_name, orderer_contact ?? "", recipients);
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
