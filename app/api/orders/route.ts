import { NextRequest, NextResponse } from "next/server";
import { insertOrder, queryRows } from "@/lib/db";
import type { OrderInput } from "@/types/order";

export async function POST(req: NextRequest) {
  const body: OrderInput = await req.json();
  const { orderer_name, orderer_contact, recipients } = body;

  if (!orderer_name || !recipients?.length) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  const id = await insertOrder(orderer_name, orderer_contact ?? "", recipients);
  return NextResponse.json({ id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;
  return NextResponse.json(await queryRows(date));
}
