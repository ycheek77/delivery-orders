"use client";

import { useState, useEffect, useRef } from "react";

interface Customer {
  id: number;
  name: string;
  contact: string;
  address: string;
  company: string;
}

export default function CustomerAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/customers", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ text: `${data.count}명 업로드 완료`, ok: true });
      refresh();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "오류 발생", ok: false });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;
    await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* 안내 */}
      <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
        <p className="font-semibold mb-1">📋 수령인 DB 사용 방법</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li>엑셀 파일(이름 / 연락처 / 주소 / 회사명)을 업로드하면 일괄 등록됩니다.</li>
          <li>같은 이름이 이미 있으면 연락처·주소·회사명이 업데이트됩니다.</li>
          <li>등록된 수령인은 주문 폼 수령인 카드에서 이름 또는 연락처로 검색해 자동 입력할 수 있습니다.</li>
        </ul>
      </div>

      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          ref={fileRef}
          id="cust-upload"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleUpload}
        />
        <label
          htmlFor="cust-upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium cursor-pointer"
        >
          {uploading ? "업로드 중…" : "📤 엑셀 업로드"}
        </label>
        <a
          href="/api/customers/template"
          download
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
        >
          📥 템플릿 다운로드
        </a>
        {msg && (
          <span className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-red-500"}`}>
            {msg.ok ? "✅" : "❌"} {msg.text}
          </span>
        )}
      </div>

      {/* 고객 테이블 */}
      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중…</p>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">등록된 주문자가 없습니다.</p>
          <p className="text-xs mt-1">엑셀 파일을 업로드해 주세요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">이름</th>
                <th className="px-4 py-3 text-left font-semibold">연락처</th>
                <th className="px-4 py-3 text-left font-semibold">주소</th>
                <th className="px-4 py-3 text-left font-semibold">회사명</th>
                <th className="px-4 py-3 text-left font-semibold w-16">관리</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.contact || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{c.address || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-500">{c.company || "-"}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-gray-400 border-t">총 {customers.length}명</div>
        </div>
      )}
    </div>
  );
}
