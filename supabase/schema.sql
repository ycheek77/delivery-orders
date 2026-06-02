-- ============================================================
-- delivery-orders Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 한 번만 실행하세요.
-- ============================================================

-- 1. 주문 (orders)
CREATE TABLE IF NOT EXISTS orders (
  id            BIGSERIAL PRIMARY KEY,
  orderer_name  TEXT NOT NULL,
  orderer_contact TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL
);

-- 2. 수령인 (recipients)
CREATE TABLE IF NOT EXISTS recipients (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipient_name  TEXT NOT NULL,
  address         TEXT NOT NULL DEFAULT '',
  contact         TEXT NOT NULL DEFAULT '',
  request         TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT ''
);

-- 3. 주문 상품 (order_items)
CREATE TABLE IF NOT EXISTS order_items (
  id            BIGSERIAL PRIMARY KEY,
  recipient_id  BIGINT NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1
);

-- 4. 수령인 DB / 고객 (customers)
--    name 은 유일값 (upsert 기준 키)
CREATE TABLE IF NOT EXISTS customers (
  id      BIGSERIAL PRIMARY KEY,
  name    TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  CONSTRAINT customers_name_key UNIQUE (name)
);

-- 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_recipients_order_id    ON recipients(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_recipient  ON order_items(recipient_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders(created_at);
