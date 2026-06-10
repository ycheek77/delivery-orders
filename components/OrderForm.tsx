"use client";

import { useState, useRef } from "react";
import { PRODUCTS } from "@/lib/products";
import RecipientAutocomplete from "./RecipientAutocomplete";

interface Item {
  product_name: string;
  quantity: number;
}

interface RecipientState {
  recipient_name: string;
  zip: string;
  address1: string;
  address2: string;
  contact: string;
  request: string;
  items: Item[];
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

const newItem      = (): Item           => ({ product_name: "", quantity: 1 });
const newRecipient = (): RecipientState => ({
  recipient_name: "", zip: "", address1: "", address2: "",
  contact: "", request: "", items: [newItem()],
});

export default function OrderForm() {
  const [recipients,  setRecipients]  = useState<RecipientState[]>([newRecipient()]);
  const [status,      setStatus]      = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg,    setErrorMsg]    = useState("");
  const address2Refs = useRef<(HTMLInputElement | null)[]>([]);

  // ── 수령인 상태 헬퍼 ────────────────────────────────────────────
  function updateRecipient(rIdx: number, field: keyof Omit<RecipientState, "items">, value: string) {
    setRecipients((p) => p.map((r, i) => i === rIdx ? { ...r, [field]: value } : r));
  }
  function updateItem(rIdx: number, iIdx: number, field: keyof Item, value: string | number) {
    setRecipients((p) => p.map((r, i) =>
      i === rIdx ? { ...r, items: r.items.map((it, j) => j === iIdx ? { ...it, [field]: value } : it) } : r
    ));
  }
  function addItem(rIdx: number) {
    setRecipients((p) => p.map((r, i) => i === rIdx ? { ...r, items: [...r.items, newItem()] } : r));
  }
  function removeItem(rIdx: number, iIdx: number) {
    setRecipients((p) => p.map((r, i) =>
      i === rIdx ? { ...r, items: r.items.filter((_, j) => j !== iIdx) } : r
    ));
  }
  function addRecipient()       { setRecipients((p) => [...p, newRecipient()]); }
  function removeRecipient(idx: number) { setRecipients((p) => p.filter((_, i) => i !== idx)); }

  // ── 수령인 자동완성 선택 ─────────────────────────────────────────
  function handleRecipientSelect(rIdx: number, name: string, contact: string, address: string) {
    const match = address.match(/^\[(\d{5})\]\s*(.+)$/);
    setRecipients((p) =>
      p.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              recipient_name: name,
              contact,
              zip:      match ? match[1] : "",
              address1: match ? match[2] : address,
              address2: "",
            }
          : r
      )
    );
  }

  // ── 카카오 주소 검색 ─────────────────────────────────────────────
  function openPostcode(rIdx: number) {
    if (!window.daum?.Postcode) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete(data) {
        let fullAddress = data.address;
        if (data.addressType === "R") {
          const extras = [data.bname, data.buildingName].filter(Boolean).join(", ");
          if (extras) fullAddress += ` (${extras})`;
        }
        setRecipients((p) => p.map((r, i) =>
          i === rIdx ? { ...r, zip: data.zonecode, address1: fullAddress, address2: "" } : r
        ));
        setTimeout(() => address2Refs.current[rIdx]?.focus(), 100);
      },
    }).open();
  }

  // ── 제출 ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const payload = {
        recipients: recipients.map((r) => ({
          recipient_name: r.recipient_name,
          address: r.zip
            ? `[${r.zip}] ${r.address1}${r.address2 ? " " + r.address2 : ""}`
            : `${r.address1}${r.address2 ? " " + r.address2 : ""}`,
          contact: r.contact,
          request: r.request,
          items:   r.items,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "주문 실패");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  // ── 완료 화면 ─────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-gray-800">주문이 접수되었습니다!</h2>
        <p className="text-gray-500 text-sm text-center">담당자가 확인 후 연락드리겠습니다.</p>
        <button
          onClick={() => { setStatus("idle"); setRecipients([newRecipient()]); }}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          새 주문하기
        </button>
        <a href="/my-orders" className="text-sm text-blue-500 hover:underline">내 주문 내역 조회 →</a>
      </div>
    );
  }

  // ── 주문 폼 ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-10">

      {/* 수령인 카드 */}
      {recipients.map((r, rIdx) => (
        <div key={rIdx} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-600 text-sm">수령인 {rIdx + 1}</span>
            {recipients.length > 1 && (
              <button type="button" onClick={() => removeRecipient(rIdx)}
                className="text-xs text-red-400 hover:text-red-600 font-medium">
                수령인 삭제
              </button>
            )}
          </div>

          {/* 수령인 검색 자동완성 */}
          <RecipientAutocomplete
            onSelect={(name, contact, address) => handleRecipientSelect(rIdx, name, contact, address)}
          />

          {/* 제품 행 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">주문 제품</label>
            {r.items.map((item, iIdx) => (
              <div key={iIdx} className="flex gap-2 items-center">
                <select
                  value={item.product_name}
                  onChange={(e) => updateItem(rIdx, iIdx, "product_name", e.target.value)}
                  required
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">제품 선택 *</option>
                  {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="number" min={1} value={item.quantity}
                  onChange={(e) => updateItem(rIdx, iIdx, "quantity", Number(e.target.value))}
                  required
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {r.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(rIdx, iIdx)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 text-lg leading-none flex-shrink-0">
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addItem(rIdx)}
              className="text-blue-500 text-sm font-medium text-left hover:text-blue-700 mt-0.5">
              + 제품 추가
            </button>
          </div>

          {/* 수령인 정보 */}
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
            <input type="text" placeholder="수령인명 *" value={r.recipient_name}
              onChange={(e) => updateRecipient(rIdx, "recipient_name", e.target.value)} required
              className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />

            {/* 주소 3분할 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">주소 *</label>
              <div className="flex gap-2">
                <input type="text" value={r.zip} readOnly placeholder="우편번호"
                  className="w-28 border border-gray-300 rounded-lg px-3 py-3 text-base bg-gray-50 text-gray-600 cursor-default" />
                <button type="button" onClick={() => openPostcode(rIdx)}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-gray-900 font-semibold text-sm rounded-lg transition-all">
                  🔍 주소 찾기
                </button>
              </div>
              <input type="text" value={r.address1}
                onChange={(e) => updateRecipient(rIdx, "address1", e.target.value)}
                placeholder="기본주소 (주소 찾기 버튼을 눌러주세요)" required
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" ref={(el) => { address2Refs.current[rIdx] = el; }}
                value={r.address2} onChange={(e) => updateRecipient(rIdx, "address2", e.target.value)}
                placeholder="상세주소 입력 (동/호수 등)" disabled={!r.address1}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400" />
            </div>

            <input type="tel" placeholder="연락처 * (010-0000-0000)" value={r.contact}
              onChange={(e) => updateRecipient(rIdx, "contact", e.target.value)} required
              className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea placeholder="요청사항 (선택)" value={r.request}
              onChange={(e) => updateRecipient(rIdx, "request", e.target.value)} rows={2}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addRecipient}
        className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-500 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm">
        + 수령인 추가
      </button>

      {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === "loading"}
        className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 active:scale-95 transition-all">
        {status === "loading" ? "주문 중…" : "주문 접수"}
      </button>

      <a href="/my-orders" className="text-center text-sm text-gray-400 hover:text-blue-500">
        📦 내 주문 내역 조회
      </a>
    </form>
  );
}
