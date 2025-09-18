/**
 * 初始化 PostgreSQL 資料庫
 * 使用方法：node init-postgres.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// PostgreSQL 連接配置
const pgConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

async function initPostgresDatabase() {
  console.log("🔄 初始化 PostgreSQL 資料庫...");

  if (!pgConfig.connectionString) {
    console.error("❌ 未找到 DATABASE_URL 或 POSTGRES_URL 環境變數");
    console.log("請確保 Railway PostgreSQL 服務已添加並配置了環境變數");
    return;
  }

  const pool = new Pool(pgConfig);

  try {
    // 測試連接
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL 連接成功");

    // 讀取 schema 檔案
    const schemaPath = path.join(__dirname, "../database_postgres_schema.sql");
    if (!fs.existsSync(schemaPath)) {
      console.error("❌ PostgreSQL schema 檔案不存在:", schemaPath);
      return;
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("📄 讀取 schema 檔案成功");

    // 執行 schema
    await pool.query(schema);
    console.log("✅ PostgreSQL 資料庫初始化完成");

    // 檢查表格是否創建成功
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log("📋 已創建的表格:");
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (error) {
    console.error("❌ PostgreSQL 初始化失敗:", error.message);
  } finally {
    await pool.end();
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  initPostgresDatabase().catch(console.error);
}

module.exports = { initPostgresDatabase };
