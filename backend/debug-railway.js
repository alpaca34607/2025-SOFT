const path = require("path");

// 載入環境變數
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("🔍 Railway 環境變數診斷:");
console.log("=====================================");

// 檢查所有相關的環境變數
const envVars = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "PGDATABASE",
  "RAILWAY_DATABASE_URL",
  "NODE_ENV",
  "RAILWAY_ENVIRONMENT",
  "PORT",
  "PUBLIC_API_URL",
  "API_BASE_URL",
];

envVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // 如果是數據庫URL，只顯示前後部分，隱藏中間的敏感信息
    if (varName.includes("DATABASE") || varName.includes("POSTGRES")) {
      const parts = value.split("@");
      if (parts.length === 2) {
        console.log(
          `  ${varName}: ${parts[0]}@${parts[1].substring(0, 20)}...`
        );
      } else {
        console.log(`  ${varName}: ${value.substring(0, 50)}...`);
      }
    } else {
      console.log(`  ${varName}: ${value}`);
    }
  } else {
    console.log(`  ${varName}: 未設置`);
  }
});

console.log("=====================================");

// 檢查數據庫適配器配置
console.log("🔍 數據庫適配器配置:");
const usePostgres =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PGDATABASE ||
  process.env.RAILWAY_DATABASE_URL ||
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "staging" ||
  process.env.RAILWAY_ENVIRONMENT;

console.log(`  - 使用 PostgreSQL: ${usePostgres ? "是" : "否"}`);

if (usePostgres) {
  console.log("  - 將使用 PostgreSQL 數據庫");
} else {
  console.log("  - 將使用 SQLite 數據庫");
}

console.log("=====================================");
console.log("✅ 診斷完成");
