import fs from "fs";
import path from "path";

// Vercel 환경에서는 프로젝트 루트가 읽기 전용이므로 /tmp 사용
const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "data", "db.json");

// ── 내부 타입 ────────────────────────────────────────────────────
interface DbOrder {
  id: number;
  orderer_name: string;
  orderer_contact: string;
  created_at: string;
}

interface DbRecipient {
  id: number;
  order_id: number;
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  tracking_number: string;
}

interface DbItem {
  id: number;
  recipient_id: number;
  product_name: string;
  quantity: number;
}

interface DbCustomer {
  id: number;
  name: string;
  contact: string;
  address: string;
  company: string;
}

interface DbData {
  orders: DbOrder[];
  recipients: DbRecipient[];
  order_items: DbItem[];
  customers: DbCustomer[];
  _meta: {
    next_order_id: number;
    next_recipient_id: number;
    next_item_id: number;
    next_customer_id: number;
  };
}

// ── 파일 읽기/쓰기 ───────────────────────────────────────────────
function load(): DbData {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const initial: DbData = {
      orders: [], recipients: [], order_items: [], customers: [],
      _meta: { next_order_id: 1, next_recipient_id: 1, next_item_id: 1, next_customer_id: 1 },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Partial<DbData>;
  // 이전 버전 DB 호환
  return {
    orders:      raw.orders      ?? [],
    recipients:  raw.recipients  ?? [],
    order_items: raw.order_items ?? [],
    customers:   (raw.customers  ?? []).map((c) => ({ ...c, address: c.address ?? "" })),
    _meta: {
      next_order_id:     raw._meta?.next_order_id     ?? 1,
      next_recipient_id: raw._meta?.next_recipient_id ?? 1,
      next_item_id:      raw._meta?.next_item_id      ?? 1,
      next_customer_id:  raw._meta?.next_customer_id  ?? 1,
    },
  };
}

function save(data: DbData) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

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

// ── 헬퍼: 수령인 평탄화 ─────────────────────────────────────────
function buildFlatRows(orders: DbOrder[], db: DbData): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const order of orders) {
    const recs = db.recipients.filter((r) => r.order_id === order.id);
    for (const rec of recs) {
      const items = db.order_items.filter((i) => i.recipient_id === rec.id);
      const products = items.map((i) => `${i.product_name} ${i.quantity}개`).join(" * ");
      rows.push({
        recipient_id: rec.id,
        order_id: order.id,
        orderer_name: order.orderer_name,
        orderer_contact: order.orderer_contact ?? "",
        recipient_name: rec.recipient_name,
        address: rec.address,
        contact: rec.contact,
        request: rec.request,
        products,
        tracking_number: rec.tracking_number ?? "",
        created_at: order.created_at,
      });
    }
  }
  return rows;
}

// ── 주문 저장 ────────────────────────────────────────────────────
export function insertOrder(
  orderer_name: string,
  orderer_contact: string,
  recipients: RecipientInput[]
): number {
  const db = load();
  const orderId = db._meta.next_order_id++;
  db.orders.push({ id: orderId, orderer_name, orderer_contact, created_at: nowKST() });

  for (const r of recipients) {
    const recipientId = db._meta.next_recipient_id++;
    db.recipients.push({
      id: recipientId, order_id: orderId,
      recipient_name: r.recipient_name, address: r.address,
      contact: r.contact, request: r.request ?? "", tracking_number: "",
    });
    for (const item of r.items) {
      db.order_items.push({
        id: db._meta.next_item_id++, recipient_id: recipientId,
        product_name: item.product_name, quantity: item.quantity,
      });
    }
  }
  save(db);
  return orderId;
}

// ── 주문 조회 (관리자) ───────────────────────────────────────────
export function queryRows(date?: string): FlatRow[] {
  const db = load();
  let orders = date
    ? db.orders.filter((o) => o.created_at.startsWith(date))
    : db.orders;
  orders = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return buildFlatRows(orders, db);
}

export function queryRowsAsc(date?: string): FlatRow[] {
  return queryRows(date).reverse();
}

// ── 내 주문 조회 (주문자 본인) ───────────────────────────────────
// 이름 + 연락처 둘 다 일치해야만 조회 허용
export function queryByOrderer(name: string, contact: string): FlatRow[] {
  const db = load();
  const orders = db.orders
    .filter((o) => o.orderer_name === name && (o.orderer_contact ?? "") === contact)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return buildFlatRows(orders, db);
}

// ── 고객 DB ──────────────────────────────────────────────────────
export function getAllCustomers(): Customer[] {
  const db = load();
  return [...db.customers].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function searchCustomers(query: string): Customer[] {
  const db = load();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.contact.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, ""))
  );
}

export function upsertCustomers(
  list: { name: string; contact: string; address?: string; company?: string }[]
): number {
  const db = load();
  let count = 0;
  for (const item of list) {
    const name = item.name?.trim();
    if (!name) continue;
    const contact = (item.contact ?? "").toString().trim();
    const address = (item.address ?? "").toString().trim();
    const company = (item.company ?? "").toString().trim();
    const existing = db.customers.find((c) => c.name === name);
    if (existing) {
      existing.contact = contact;
      existing.address = address;
      existing.company = company;
    } else {
      db.customers.push({ id: db._meta.next_customer_id++, name, contact, address, company });
    }
    count++;
  }
  save(db);
  return count;
}

export function deleteCustomer(id: number): boolean {
  const db = load();
  const before = db.customers.length;
  db.customers = db.customers.filter((c) => c.id !== id);
  if (db.customers.length < before) { save(db); return true; }
  return false;
}

// ── 송장번호 일괄 업데이트 ────────────────────────────────────────
export function updateTrackingNumbers(
  rows: { name: string; contact: string; tracking_number: string }[]
): number {
  const db = load();
  let updated = 0;

  for (const row of rows) {
    const tn      = row.tracking_number?.trim();
    const name    = row.name?.trim();
    const contact = row.contact?.trim();
    if (!tn || !name || !contact) continue;

    // (수령인명 + 연락처) 로 매칭, 가장 최근 미입력 건 우선, 없으면 최신 건
    const candidates = db.recipients
      .filter((r) => r.recipient_name === name && r.contact === contact)
      .sort((a, b) => b.id - a.id);
    if (candidates.length === 0) continue;

    const target = candidates.find((r) => !r.tracking_number) ?? candidates[0];
    target.tracking_number = tn;
    updated++;
  }

  save(db);
  return updated;
}
