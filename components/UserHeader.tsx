"use client";

import { useRouter } from "next/navigation";

interface Props {
  userName: string;
}

export default function UserHeader({ userName }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-semibold text-white">{userName}님</span>
      <button
        onClick={handleLogout}
        className="text-xs text-blue-200 hover:text-white underline underline-offset-2 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
