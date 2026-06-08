import OrderPage from "@/components/OrderPage";

export default function Home() {
  return (
    <main className="max-w-lg mx-auto">
      <header className="bg-blue-600 text-white px-4 py-5">
        <h1 className="text-xl font-bold">택배 주문 접수</h1>
        <p className="text-blue-200 text-sm mt-1">아래 정보를 입력해 주세요</p>
      </header>
      <OrderPage />
    </main>
  );
}
