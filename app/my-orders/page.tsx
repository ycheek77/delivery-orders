import MyOrders from "@/components/MyOrders";
import Link from "next/link";

export default function MyOrdersPage() {
  return (
    <main className="max-w-lg mx-auto">
      <header className="bg-blue-600 text-white px-4 py-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-blue-200 hover:text-white text-sm">← 주문하기</Link>
        </div>
        <h1 className="text-xl font-bold">내 주문 내역</h1>
        <p className="text-blue-200 text-sm mt-1">이름과 연락처로 본인 주문만 조회됩니다</p>
      </header>
      <MyOrders />
    </main>
  );
}
