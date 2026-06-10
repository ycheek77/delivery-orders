import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import OrderPage from "@/components/OrderPage";
import UserHeader from "@/components/UserHeader";

export default async function Home() {
  // 서버 사이드에서 JWT 읽기
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let userName = "사용자";
  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload?.name) userName = payload.name;
  }

  return (
    <main className="max-w-lg mx-auto">
      <header className="bg-blue-600 text-white px-4 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">택배 주문 접수</h1>
            <p className="text-blue-200 text-sm mt-1">아래 정보를 입력해 주세요</p>
          </div>
          <UserHeader userName={userName} />
        </div>
      </header>
      <OrderPage />
    </main>
  );
}
