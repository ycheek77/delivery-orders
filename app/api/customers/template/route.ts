import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("주문자목록");

  ws.columns = [
    { header: "이름",        key: "name",    width: 15 },
    { header: "연락처",      key: "contact", width: 20 },
    { header: "주소",        key: "address", width: 45 },
    { header: "회사명(선택)", key: "company", width: 22 },
  ];

  ws.getRow(1).eachCell((cell) => {
    cell.font  = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(1).height = 28;

  // 예시 데이터
  ws.addRow({ name: "홍길동", contact: "010-1234-5678", address: "[06141] 서울시 강남구 테헤란로 123", company: "ABC회사" });
  ws.addRow({ name: "김영희", contact: "010-9876-5432", address: "[12345] 경기도 수원시 팔달구 행궁로 1", company: "" });

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("주문자목록_템플릿.xlsx")}`,
    },
  });
}
