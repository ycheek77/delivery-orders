import { createClient } from "@supabase/supabase-js";

// ── Supabase 클라이언트 (서버 전용 — service_role 키) ─────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── 현재 한국 시간 문자열 ─────────────────────────────────────────
function nowKST(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })
    .replace("T", " ");
}

// ── 공개 타입 ────────────────────────────────────────────────────
export interface RecipientInput {
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  items: { product_name: string; quantity: number }[];
}

export interface FlatRow {
  recipient_id: number;
  order_id: number;
  orderer_name: string;
  orderer_contact: string;
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  products: string;
  tracking_number: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  address: string;
  company: string;
}

// ── 내부 Supabase 행 타입 ─────────────────────────────────────────
interface DbOrderRow {
  id: number;
  orderer_name: string;
  orderer_contact: string;
  created_at: string;
  recipients: {
    id: number;
    recipient_name: string;
    address: string;
    contact: string;
    request: string;
    tracking_number: string;
    order_items: { product_name: string; quantity: number }[];
  }[];
}

// ── Supabase 중첩 결과 → FlatRow 변환 ────────────────────────────
function buildFlatRows(orders: DbOrderRow[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const order of orders) {
    for (const rec of order.recipients ?? []) {
      const items = rec.order_items ?? [];
      const products = items
        .map((i) => `${i.product_name} ${i.quantity}개`)
        .join(" * ");
      rows.push({
        recipient_id:    rec.id,
        order_id:        order.id,
        orderer_name:    order.orderer_name,
        orderer_contact: order.orderer_contact ?? "",
        recipient_name:  rec.recipient_name,
        address:         rec.address,
        contact:         rec.contact,
        request:         rec.request,
        products,
        tracking_number: rec.tracking_number ?? "",
        created_at:      order.created_at,
      });
    }
  }
  return rows;
}

const ORDER_SELECT = `
  id, orderer_name, orderer_contact, created_at,
  recipients (
    id, recipient_name, address, contact, request, tracking_number,
    order_items ( product_name, quantity )
  )
` as const;

// ── 주문 저장 ────────────────────────────────────────────────────
export async function insertOrder(
  orderer_name: string,
  orderer_contact: string,
  recipients: RecipientInput[]
): Promise<number> {
  // 1) 주문 삽입
  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .insert({ orderer_name, orderer_contact, created_at: nowKST() })
    .select("id")
    .single();
  if (orderErr || !orderData) throw new Error(orderErr?.message ?? "주문 저장 실패");

  const orderId: number = orderData.id;

  for (const r of recipients) {
    // 2) 수령인 삽입
    const { data: recData, error: recErr } = await supabase
      .from("recipients")
      .insert({
        order_id:        orderId,
        recipient_name:  r.recipient_name,
        address:         r.address,
        contact:         r.contact,
        request:         r.request ?? "",
        tracking_number: "",
      })
      .select("id")
      .single();
    if (recErr || !recData) throw new Error(recErr?.message ?? "수령인 저장 실패");

    const recipientId: number = recData.id;

    // 3) 상품 삽입
    if (r.items.length > 0) {
      const { error: itemErr } = await supabase
        .from("order_items")
        .insert(
          r.items.map((item) => ({
            recipient_id: recipientId,
            product_name: item.product_name,
            quantity:     item.quantity,
          }))
        );
      if (itemErr) throw new Error(itemErr.message);
    }
  }

  return orderId;
}

// ── 주문 조회 (내림차순) ─────────────────────────────────────────
export async function queryRows(date?: string): Promise<FlatRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase.from("orders").select(ORDER_SELECT) as any);
  if (date) q = q.like("created_at", `${date}%`);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return buildFlatRows((data ?? []) as DbOrderRow[]);
}

// ── 주문 조회 (오름차순) ─────────────────────────────────────────
export async function queryRowsAsc(date?: string): Promise<FlatRow[]> {
  return (await queryRows(date)).reverse();
}

// ── 내 주문 조회 (주문자 이름) ────────────────────────────────────
export async function queryByOrderer(name: string): Promise<FlatRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("orders").select(ORDER_SELECT) as any)
    .eq("orderer_name", name)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return buildFlatRows((data ?? []) as DbOrderRow[]);
}

// ── 고객 전체 조회 ────────────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Customer[];
}

// ── 고객 검색 (이름 또는 연락처 숫자) ────────────────────────────
export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // 전체 fetch 후 인메모리 필터 (연락처 숫자-only 비교 포함)
  const { data, error } = await supabase.from("customers").select("*");
  if (error) throw new Error(error.message);

  const digits = q.replace(/[^0-9]/g, "");
  return ((data ?? []) as Customer[]).filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (digits.length > 0 &&
        c.contact.replace(/[^0-9]/g, "").includes(digits))
  );
}

// ── 고객 일괄 추가/갱신 (이름+연락처 기준 upsert) ───────────────
export async function upsertCustomers(
  list: { name: string; contact: string; address?: string; company?: string }[]
): Promise<number> {
  const toUpsert = list
    .map((item) => ({
      name:    item.name?.trim() ?? "",
      contact: (item.contact ?? "").toString().trim(),
      address: (item.address ?? "").toString().trim(),
      company: (item.company ?? "").toString().trim(),
    }))
    .filter((item) => item.name);

  if (toUpsert.length === 0) return 0;

  // 같은 (이름+연락처) 조합이 여러 행 있으면 PostgreSQL 배치 upsert가
  // "affect a row a second time" 오류를 냄 → 중복 제거 (뒤 행이 앞 행 덮어씀)
  const dedupMap = new Map<string, typeof toUpsert[number]>();
  for (const item of toUpsert) dedupMap.set(`${item.name}||${item.contact}`, item);
  const deduped = Array.from(dedupMap.values());

  const { error } = await supabase
    .from("customers")
    .upsert(deduped, { onConflict: "name,contact" });
  if (error) throw new Error(error.message);

  return deduped.length;
}

// ── 고객 삭제 ─────────────────────────────────────────────────────
export async function deleteCustomer(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);
  return !error;
}

// ── 송장번호 일괄 업데이트 ────────────────────────────────────────
export async function updateTrackingNumbers(
  rows: { name: string; contact: string; tracking_number: string }[]
): Promise<number> {
  let updated = 0;

  for (const row of rows) {
    const tn      = row.tracking_number?.trim();
    const name    = row.name?.trim();
    const contact = row.contact?.trim();
    if (!tn || !name || !contact) continue;

    // 수령인명 + 연락처 매칭 → 최근 미입력 건 우선
    const { data: candidates } = await supabase
      .from("recipients")
      .select("id, tracking_number")
      .eq("recipient_name", name)
      .eq("contact", contact)
      .order("id", { ascending: false });

    if (!candidates?.length) continue;

    const target =
      candidates.find((r) => !r.tracking_number) ?? candidates[0];

    const { error } = await supabase
      .from("recipients")
      .update({ tracking_number: tn })
      .eq("id", target.id);

    if (!error) updated++;
  }

  return updated;
}
