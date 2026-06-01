"use client";

import { useState, useEffect, useRef } from "react";

interface Customer {
  id: number;
  name: string;
  contact: string;
  company: string;
}

interface Props {
  name: string;
  contact: string;
  onNameChange:    (name: string)    => void;
  onContactChange: (contact: string) => void;
}

export default function OrdererAutocomplete({ name, contact, onNameChange, onContactChange }: Props) {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const address2Ref = useRef<HTMLInputElement>(null);

  // 이름 변경 시 자동완성 검색 (디바운스 200ms)
  useEffect(() => {
    const q = name.trim();
    if (!q) { setSuggestions([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
        const data: Customer[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [name]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(c: Customer) {
    onNameChange(c.name);
    onContactChange(c.contact);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 주문자명 + 자동완성 드롭다운 */}
      <div ref={wrapRef} className="relative">
        <label className="text-sm font-medium text-gray-700">주문자명 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { onNameChange(e.target.value); onContactChange(""); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="이름을 입력하면 자동완성됩니다"
          required
          className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {open && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {suggestions.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => select(c)}
                className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
              >
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">{c.company || c.contact}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 연락처 (자동입력 또는 직접입력) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">주문자 연락처 *</label>
        <input
          ref={address2Ref}
          type="tel"
          value={contact}
          onChange={(e) => onContactChange(e.target.value)}
          placeholder="010-0000-0000"
          required
          className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {contact && (
          <p className="text-xs text-blue-500">✓ 자동 입력됨 — 수정하려면 직접 입력하세요</p>
        )}
      </div>
    </div>
  );
}
