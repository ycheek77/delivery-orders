import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import MyOrders from "@/components/MyOrders";
import UserHeader from "@/components/UserHeader";

export default async function MyOrdersPage() {
  // 서버 사이드에서 JWT 읽기
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let userName = "사용자";
  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload?.name) userName = payload.name;
  }

  return (
    <main className="max-w-2xl mx-auto">
      <header className="bg-blue-600 text-white px-4 py-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-1">
              <a
                href="/"
                className="text-blue-200 hover:text-white text-xs font-medium transition-colors"
              >
                ← 주문하기
              </a>
            </div>
            <h1 className="text-xl font-bold">내 주문 내역</h1>
            <p className="text-blue-200 text-sm mt-0.5">접속 코드 기준 본인 주문만 표시됩니다</p>
          </div>
          <UserHeader userName={userName} />
        </div>
      </header>
      <MyOrders />
    </main>
  );
}
