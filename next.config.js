/** @type {import('next').NextConfig} */
const nextConfig = {
  // ExcelJS와 그 의존성(archiver, unzipper 등)을 번들에 포함하지 않고
  // Node.js가 런타임에 직접 require()하도록 설정 (Vercel 서버리스 호환)
  serverExternalPackages: ["exceljs"],
};

module.exports = nextConfig;
