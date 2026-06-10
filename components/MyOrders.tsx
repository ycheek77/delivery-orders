"use client";

import { useState, useEffect } from "react";
import type { RecipientRow } from "@/types/order";

// 상태 뱃지 스타일
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "접수"     ? "bg-blue-100 text-blue-700" :
    status === "처리중"   ? "bg-amber-100 text-amber-700" :
    status === "발송완료" ? "bg-green-100 text-green-700" :
    status === "취소"     ? "bg-gray-100 text-gray-500 line-through" :
    "bg-gray-100 text-gray-500";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status || "접수"}
    </span>
  );
}

export default function MyOrders() {
  const [rows,       setRows]       = useState<RecipientRow[] | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  // 페이지 진입 시 본인 주문 자동 조회
  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/my-orders");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "주문 조회 실패");
      }
      const data: RecipientRow[] = await res.json();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 우편번호 없을 때 생긴 "[] " 접두어 제거
  function cleanAddress(addr: string) {
    return addr.replace(/^\[\s*\]\s*/, "");
  }

  // 주문 취소 — JWT 쿠키의 access_code_id로 서버에서 본인 확인
  async function handleCancel(orderId: number) {
    if (!confirm("이 주문을 취소하시겠습니까?")) return;
    setCancelling(orderId);
    try {
      const res = await fetch("/api/orders/cancel", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "취소 실패");
      // 목록 즉시 반영
      setRows((prev) =>
        prev
          ? prev.map((r) =>
              r.order_id === orderId ? { ...r, status: "취소" } : r
            )
          : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "취소 중 오류가 발생했습니다.");
    } finally {
      setCancelling(null);
    }
  }

  // ── 렌더링 ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 pb-10 pt-6">

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2 animate-pulse">📦</p>
          <p className="text-sm">주문 내역을 불러오는 중…</p>
        </div>
      )}

      {/* 오류 */}
      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">❌</p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 결과 없음 */}
      {!loading && !error && rows !== null && rows.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">등록된 주문이 없습니다.</p>
          <a href="/" className="mt-3 inline-block text-sm text-blue-500 hover:underline">
            주문하러 가기 →
          </a>
        </div>
      )}

      {/* 주문 목록 */}
      {!loading && !error && rows !== null && rows.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            총 <span className="font-bold text-blue-600">{rows.length}건</span>의 주문 내역
          </p>
          {rows.map((r, i) => {
            const status     = r.status ?? "";
            const isCancelled = status === "취소";
            const canCancel   = status === "접수" || status === "";
            return (
              <div
                key={`${r.order_id}-${r.recipient_id}-${i}`}
                className={`border rounded-xl p-4 shadow-sm ${
                  isCancelled
                    ? "border-gray-200 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">{r.created_at}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status || "접수"} />
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      주문 #{r.order_id}
                    </span>
                  </div>
                </div>

                <p
                  className={`font-semibold mb-2 ${
                    isCancelled ? "text-gray-400 line-through" : "text-blue-700"
                  }`}
                >
                  {r.products}
                </p>

                {!isCancelled && (
                  r.tracking_number ? (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-lg">🚚</span>
                      <div>
                        <p className="text-xs text-green-600 font-medium">송장번호</p>
                        <p className="text-sm font-bold text-green-800 tracking-wider">
                          {r.tracking_number}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-base">📦</span>
                      <p className="text-xs text-gray-400">송장번호 미등록 — 배송 준비 중</p>
                    </div>
                  )
                )}

                {isCancelled && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-base">🚫</span>
                    <p className="text-xs text-gray-400">취소된 주문입니다.</p>
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>수령인: <span className="font-medium text-gray-800">{r.recipient_name}</span></p>
                  <p>주소: {cleanAddress(r.address)}</p>
                  <p>연락처: {r.contact}</p>
                  {r.request && <p className="text-gray-400">요청: {r.request}</p>}
                </div>

                {/* 취소 버튼: 접수 상태만 표시 */}
                {canCancel && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleCancel(r.order_id)}
                      disabled={cancelling === r.order_id}
                      className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {cancelling === r.order_id ? "취소 중…" : "주문 취소"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
