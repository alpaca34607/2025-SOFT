// TiDB-only database adapter backed by Prisma.

const dbModule = require("./database-prisma");

console.log("🔍 資料庫配置檢查:");
console.log(
  "  - DATABASE_URL:",
  process.env.DATABASE_URL ? "已設置" : "未設置"
);
console.log("  - 資料庫引擎: Prisma + MySQL/TiDB");

module.exports = {
  query: dbModule.query,
  get: dbModule.get,
  run: dbModule.run,
  setupDatabase: dbModule.setupDatabase,
  getDatabase: () => dbModule.prisma,
};
