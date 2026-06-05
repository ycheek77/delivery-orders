"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RecipientRow } from "@/types/order";
import CustomerAdmin from "./CustomerAdmin";

type Tab = "orders" | "customers";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 bg-white">
        <TabBtn label="📋 주문 조회"   active={tab === "orders"}    onClick={() => setTab("orders")}    />
        <TabBtn label="👥 수령인 DB"   active={tab === "customers"} onClick={() => setTab("customers")} />
      </div>

      {tab === "orders"    && <OrdersTab />}
      {tab === "customers" && <CustomerAdmin />}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

// 한국 시간(KST) 기준 오늘 날짜 YYYY-MM-DD
function todayKST() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

function OrdersTab() {
  const [date,        setDate]        = useState(todayKST);
  const [rows,        setRows]        = useState<RecipientRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [trackingMsg, setTrackingMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const trackingFileRef = useRef<HTMLInputElement>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch(`/api/orders?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "주문 조회 실패");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleTrackingUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTrackingMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/tracking", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrackingMsg({ text: `${data.count}건 송장번호 업데이트 완료`, ok: true });
      fetchOrders(); // 테이블 새로고침
    } catch (err) {
      setTrackingMsg({ text: err instanceof Error ? err.message : "오류 발생", ok: false });
    } finally {
      setUploading(false);
      if (trackingFileRef.current) trackingFileRef.current.value = "";
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* 주문 조회 툴바 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
        >
          조회
        </button>
        <button
          onClick={() => window.open(`/api/export?date=${date}`, "_blank")}
          disabled={rows.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-green-500"
        >
          📥 주문 엑셀 ({rows.length}건)
        </button>
      </div>

      {/* 송장번호 업로드 섹션 */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <span className="text-sm font-medium text-amber-800">🚚 송장번호</span>
        <input
          ref={trackingFileRef}
          id="tracking-upload"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleTrackingUpload}
        />
        <label
          htmlFor="tracking-upload"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-medium cursor-pointer"
        >
          {uploading ? "업로드 중…" : "📤 송장번호 업로드"}
        </label>
        <a
          href="/api/tracking"
          download
          className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50"
        >
          📋 입력양식 다운로드
        </a>
        {trackingMsg && (
          <span className={`text-sm font-medium ${trackingMsg.ok ? "text-green-700" : "text-red-600"}`}>
            {trackingMsg.ok ? "✅" : "❌"} {trackingMsg.text}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">불러오는 중…</p>
      ) : fetchError ? (
        <p className="text-red-500 text-sm">❌ {fetchError}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">해당 날짜에 주문이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-blue-600 text-white">
              <tr>
                {["번호","주문일시","주문자","수령인명","제품및수량","주소","연락처","요청사항","송장번호"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const noRecipient = r.recipient_id === 0;
                return (
                  <tr key={`${r.order_id}-${r.recipient_id}-${i}`}
                    className={noRecipient ? "bg-amber-50" : i % 2 === 1 ? "bg-blue-50" : "bg-white"}>
                    <td className="px-3 py-2 text-gray-500">{r.order_id}</td>
                    <td className="px-3 py-2">{r.created_at}</td>
                    <td className="px-3 py-2 font-medium">{r.orderer_name}</td>
                    <td className="px-3 py-2">
                      {noRecipient
                        ? <span className="text-amber-600 text-xs font-medium">⚠ 수령인 미등록</span>
                        : r.recipient_name}
                    </td>
                    <td className="px-3 py-2 font-medium text-blue-700">{r.products || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{r.address || "-"}</td>
                    <td className="px-3 py-2">{r.contact || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate text-gray-500">{r.request || "-"}</td>
                    <td className="px-3 py-2">
                      {r.tracking_number
                        ? <span className="text-green-700 font-medium">{r.tracking_number}</span>
                        : <span className="text-gray-300 text-xs">미입력</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
