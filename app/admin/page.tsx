import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <main>
      <header className="bg-gray-800 text-white px-4 py-4 mb-2">
        <h1 className="text-lg font-bold">관리자 — 주문 현황</h1>
      </header>
      <AdminPanel />
    </main>
  );
}
