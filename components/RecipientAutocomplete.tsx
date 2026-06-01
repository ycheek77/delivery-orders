"use client";

import { useState, useRef } from "react";

interface CustomerSuggestion {
  id: number;
  name: string;
  contact: string;
  address: string;
  company: string;
}

interface Props {
  onSelect: (name: string, contact: string, address: string) => void;
}

export default function RecipientAutocomplete({ onSelect }: Props) {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [open,        setOpen]        = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(q: string) {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    try {
      const res  = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      const data: CustomerSuggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]); setOpen(false);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 250);
  }

  function handleSelect(c: CustomerSuggestion) {
    onSelect(c.name, c.contact, c.address ?? "");
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder="🔍 수령인 검색 (이름 또는 연락처) — 선택 시 자동 입력"
        className="w-full border border-blue-300 rounded-lg px-4 py-2.5 text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-sm text-gray-500">{c.contact}</span>
              </div>
              {c.address && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{c.address}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
