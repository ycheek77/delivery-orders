"use client";

import { useState } from "react";
import OrderForm from "./OrderForm";
import BulkOrderUpload from "./BulkOrderUpload";

type Tab = "form" | "bulk";

export default function OrderPage() {
  const [tab, setTab] = useState<Tab>("form");

  return (
    <>
      <div className="flex border-b border-gray-200 bg-white">
        <TabBtn
          label="📝 직접 입력"
          active={tab === "form"}
          onClick={() => setTab("form")}
        />
        <TabBtn
          label="📤 엑셀 일괄 업로드"
          active={tab === "bulk"}
          onClick={() => setTab("bulk")}
        />
      </div>
      {tab === "form" ? <OrderForm /> : <BulkOrderUpload />}
    </>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
