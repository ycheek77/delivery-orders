"use client";

import { useState } from "react";
import type { RecipientRow } from "@/types/order";

export default function MyOrders() {
  const [name,    setName]    = useState("");
  const [contact, setContact] = useState("");
  const [rows,    setRows]    = useState<RecipientRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRows(null);
    try {
      const res = await fetch(
        `/api/my-orders?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const data: RecipientRow[] = await res.json();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-8">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">주문자명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="주문 시 입력한 이름"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">연락처 *</label>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="010-0000-0000"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "조회 중…" : "주문 내역 조회"}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      {/* 결과 */}
      {rows !== null && (
        rows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">입력하신 정보로 등록된 주문이 없습니다.</p>
            <p className="text-xs mt-1 text-gray-300">이름과 연락처를 다시 확인해 주세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">총 <span className="font-bold text-blue-600">{rows.length}건</span>의 주문 내역</p>
            {rows.map((r) => (
              <div key={r.recipient_id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">{r.created_at}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">주문 #{r.order_id}</span>
                </div>
                <p className="font-semibold text-blue-700 mb-2">{r.products}</p>
                {r.tracking_number ? (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-lg">🚚</span>
                    <div>
                      <p className="text-xs text-green-600 font-medium">송장번호</p>
                      <p className="text-sm font-bold text-green-800 tracking-wider">{r.tracking_number}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-base">📦</span>
                    <p className="text-xs text-gray-400">송장번호 미등록 — 배송 준비 중</p>
                  </div>
                )}
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>수령인: <span className="font-medium text-gray-800">{r.recipient_name}</span></p>
                  <p>주소: {r.address}</p>
                  <p>연락처: {r.contact}</p>
                  {r.request && <p className="text-gray-400">요청: {r.request}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
