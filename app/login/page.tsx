"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code,    setCode]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) {
      setError("4자리 숫자를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "인증 실패");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        {/* 로고/타이틀 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold text-gray-800">택배 주문 접수</h1>
          <p className="text-gray-500 text-sm mt-1">접속 코드를 입력해주세요</p>
        </div>

        {/* 코드 입력 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600 text-center">
              4자리 접속 코드
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              autoComplete="off"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setCode(val);
                setError("");
              }}
              placeholder="● ● ● ●"
              className="text-center text-3xl font-bold tracking-[0.4em] border-2 border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 bg-gray-50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              ❌ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 4}
            className="py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all text-lg"
          >
            {loading ? "확인 중…" : "접속"}
          </button>
        </form>
      </div>
    </div>
  );
}
