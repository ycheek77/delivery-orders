"use client";

import { useState, useRef } from "react";
import { PRODUCTS } from "@/lib/products";

interface UploadResult {
  created?:         number;
  totalRecipients?: number;
  errors?:          string[];
  error?:           string;
}

export default function BulkOrderUpload() {
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/orders/bulk", { method: "POST", body: fd });
      const data: UploadResult = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "네트워크 오류가 발생했습니다." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hasErrors  = (result?.errors?.length ?? 0) > 0;
  const isSuccess  = result?.created !== undefined && !result?.error && !hasErrors;
  const isPartial  = result?.created !== undefined && hasErrors;

  return (
    <div className="px-4 py-6 flex flex-col gap-5">

      {/* 안내 */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
        <p className="font-semibold mb-2">📋 일괄 업로드 방법</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>아래 템플릿을 다운로드하세요.</li>
          <li>컬럼 순서 <span className="font-medium">주문자 · 수령인 · 주소 · 연락처 · 제품명 · 수량</span> 에 맞게 입력하세요.</li>
          <li>같은 주문자는 하나의 주문으로 자동 묶입니다.</li>
          <li>같은 수령인이 여러 행이면 제품이 합쳐집니다.</li>
        </ol>
      </div>

      {/* 허용 제품 목록 */}
      <details className="border border-gray-200 rounded-xl overflow-hidden text-sm">
        <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-700 select-none">
          ✅ 허용 제품 목록 ({PRODUCTS.length}종)
        </summary>
        <ul className="px-4 py-3 space-y-1 text-gray-600">
          {PRODUCTS.map((p, i) => (
            <li key={p}><span className="text-gray-400 mr-2">{i + 1}.</span>{p}</li>
          ))}
        </ul>
      </details>

      {/* 버튼 */}
      <div className="flex flex-col gap-3">
        <a
          href="/api/orders/bulk/template"
          download
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium text-center transition-colors"
        >
          📥 템플릿 다운로드
        </a>

        <input
          ref={fileRef}
          id="bulk-upload"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <label
          htmlFor="bulk-upload"
          className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-colors ${
            uploading
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer"
          }`}
        >
          {uploading ? "업로드 중…" : "📤 엑셀 파일 업로드"}
        </label>
      </div>

      {/* 결과 */}
      {result && (
        <div className={`p-4 rounded-xl border text-sm ${
          isSuccess ? "bg-green-50 border-green-200"
          : isPartial ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200"
        }`}>
          {isSuccess && (
            <>
              <p className="font-semibold text-green-700 mb-1">✅ 주문 접수 완료</p>
              <p className="text-green-600">
                {result.created}건 주문 · {result.totalRecipients}명 수령인이 접수되었습니다.
              </p>
            </>
          )}

          {isPartial && (
            <>
              <p className="font-semibold text-amber-700 mb-1">
                ⚠ {result.created}건 접수 완료 (일부 실패)
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.errors!.map((err, i) => (
                  <li key={i} className="text-amber-700">• {err}</li>
                ))}
              </ul>
            </>
          )}

          {!isSuccess && !isPartial && (
            <>
              <p className="font-semibold text-red-700 mb-1">❌ 업로드 실패</p>
              {result.error && <p className="text-red-600 mb-1">{result.error}</p>}
              {result.errors && (
                <ul className="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-red-600">• {err}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
