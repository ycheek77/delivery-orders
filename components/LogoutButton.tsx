"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
    >
      로그아웃
    </button>
  );
}
