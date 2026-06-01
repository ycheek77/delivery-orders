import ExcelJS from "exceljs";
import type { RecipientRow } from "@/types/order";

// 통일 컬럼: 이름 / 주소 / 연락처 / 제품및수량 / 송장번호
const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "이름",      key: "recipient_name",  width: 14 },
  { header: "주소",      key: "address",         width: 48 },
  { header: "연락처",    key: "contact",         width: 18 },
  { header: "제품및수량", key: "products",        width: 38 },
  { header: "송장번호",  key: "tracking_number", width: 22 },
];

export async function buildExcel(rows: RecipientRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("주문목록");

  ws.columns = COLUMNS;

  // 헤더 스타일
  ws.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border    = { bottom: { style: "thin", color: { argb: "FFBFDBFE" } } };
  });
  ws.getRow(1).height = 28;

  rows.forEach((row, i) => {
    const r = ws.addRow({
      recipient_name:  row.recipient_name,
      address:         row.address,
      contact:         row.contact,
      products:        row.products,        // 이미 "제품명 수량개 * ..." 형식
      tracking_number: row.tracking_number ?? "",
    });
    r.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } };
      }
    });
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// 송장번호 업로드용 빈 템플릿 (헤더만)
export async function buildTrackingTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("송장번호입력");

  ws.columns = COLUMNS;

  ws.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(1).height = 28;

  // 안내 예시 행
  const ex = ws.addRow({
    recipient_name:  "홍길순",
    address:         "[06141] 서울시 강남구 테헤란로 123",
    contact:         "010-1234-5678",
    products:        "설포라판 2개 * 슬립B 1개",
    tracking_number: "1234567890123",
  });
  ex.eachCell((cell) => {
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9C4" } };
    cell.font      = { italic: true, color: { argb: "FF9E9E9E" } };
    cell.alignment = { vertical: "middle" };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
