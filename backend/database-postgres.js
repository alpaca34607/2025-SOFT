const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 環境變數配置
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PGDATABASE ||
  process.env.RAILWAY_DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// PostgreSQL 連接池
let pool = null;
let supabase = null;

// 初始化資料庫連接
function initializeDatabase() {
  if (DATABASE_URL) {
    // 使用 PostgreSQL 連接池
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    console.log("✅ PostgreSQL 連接池已初始化");
  }

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    // 初始化 Supabase 客戶端
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase 客戶端已初始化");
  }
}

// 立即初始化資料庫連接
initializeDatabase();

// 執行 SQL 查詢
async function query(text, params = []) {
  if (!pool) {
    console.log("🔄 資料庫連接池尚未初始化，嘗試重新初始化...");
    initializeDatabase();

    if (!pool) {
      console.error("❌ 資料庫環境變數檢查:");
      console.error("  - DATABASE_URL:", DATABASE_URL ? "已設置" : "未設置");
      console.error("  - NODE_ENV:", process.env.NODE_ENV);
      throw new Error("資料庫連接未初始化 - 請檢查 DATABASE_URL 環境變數");
    }
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// 執行單一結果查詢（相當於 SQLite 的 get）
async function get(text, params = []) {
  const result = await query(text, params);
  return result.rows[0];
}

// 執行無回傳結果的查詢（相當於 SQLite 的 run）
async function run(text, params = []) {
  const result = await query(text, params);
  return result;
}

// 初始化資料庫表格
async function initDatabase() {
  try {
    console.log("🔄 檢查資料庫是否需要初始化...");

    // 檢查資料庫是否已經初始化
    try {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
        ) as products_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        ) as orders_exists
      `);

      const { products_exists, orders_exists } = result.rows[0];

      if (products_exists && orders_exists) {
        console.log("✅ 資料庫表格已存在，跳過初始化");

        // 只運行遷移腳本
        try {
          console.log("🔄 檢查並運行資料庫遷移...");
          const {
            addOrderNumberColumn,
          } = require("./migrate-add-order-number");
          await addOrderNumberColumn();

          const {
            addPaymentPickupColumns,
          } = require("./migrate-add-payment-pickup");
          await addPaymentPickupColumns();

          const { fixImageFields } = require("./migrate-fix-image-fields");
          await fixImageFields();

          const { fixTriggerIssues } = require("./migrate-fix-trigger");
          await fixTriggerIssues();

          console.log("✅ 資料庫遷移完成");
        } catch (migrationError) {
          console.warn(
            "⚠️ 資料庫遷移失敗，但繼續運行:",
            migrationError.message
          );
        }

        return true;
      }
    } catch (error) {
      console.log("📋 資料庫檢查失敗，繼續初始化:", error.message);
    }

    console.log("🔄 開始初始化 PostgreSQL 資料庫表格...");

    // 讀取並執行 SQL schema
    const schemaPath = path.join(__dirname, "../database_postgres_schema.sql");
    let schema;

    try {
      schema = fs.readFileSync(schemaPath, "utf8");
      console.log("✅ 使用 PostgreSQL schema 檔案:", schemaPath);
    } catch (error) {
      console.log("📄 PostgreSQL schema 檔案不存在，創建基本表格...");
      schema = await createPostgreSQLSchema();
    }

    // 分割 SQL 語句並執行
    const statements = schema.split(";").filter((stmt) => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
        } catch (error) {
          console.error(
            "❌ SQL 語句執行失敗:",
            statement.substring(0, 100) + "..."
          );
          console.error("錯誤詳情:", error.message);
          throw error;
        }
      }
    }

    console.log("✅ PostgreSQL 資料庫表格初始化完成");

    // 自動運行遷移腳本
    try {
      console.log("🔄 檢查並運行資料庫遷移...");
      const { addOrderNumberColumn } = require("./migrate-add-order-number");
      await addOrderNumberColumn();

      const {
        addPaymentPickupColumns,
      } = require("./migrate-add-payment-pickup");
      await addPaymentPickupColumns();

      const { fixImageFields } = require("./migrate-fix-image-fields");
      await fixImageFields();

      const { fixTriggerIssues } = require("./migrate-fix-trigger");
      await fixTriggerIssues();

      console.log("✅ 資料庫遷移完成");
    } catch (migrationError) {
      console.warn("⚠️ 資料庫遷移失敗，但繼續運行:", migrationError.message);
    }

    return true;
  } catch (error) {
    console.error("❌ PostgreSQL 資料庫初始化失敗:", error.message);
    throw error;
  }
}

// 創建 PostgreSQL schema (備用方案)
async function createPostgreSQLSchema() {
  return `
-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 產品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    preorder_button_status VARCHAR(50) DEFAULT 'select_style',
    cell_open_status VARCHAR(50) DEFAULT 'preparing',
    cell_remaining_status VARCHAR(50) DEFAULT 'still_available',
    specifications TEXT,
    pickup_info TEXT,
    thumbnail_path VARCHAR(500),
    lightslider_images JSONB,
    sketchfab_embed_link VARCHAR(1000),
    sketchfab_background VARCHAR(500),
    product_introduction TEXT,
    preorder_notes VARCHAR(500),
    main_colors JSONB,
    sub_colors JSONB,
    image_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 客戶表
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    order_items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 注意：觸發器函數已移除，updated_at 欄位將在應用程式層面更新
`;
}

// 設置資料庫
async function setupDatabase() {
  try {
    initializeDatabase();

    if (pool) {
      // 測試連接
      await query("SELECT NOW()");
      console.log("✅ PostgreSQL 連接測試成功");

      // 初始化表格
      await initDatabase();
      return true;
    } else {
      throw new Error("無法建立資料庫連接");
    }
  } catch (error) {
    console.error("❌ 資料庫設置失敗:", error);
    throw error;
  }
}

// 關閉資料庫連接
async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log("✅ PostgreSQL 連接池已關閉");
  }
}

module.exports = {
  query,
  get,
  run,
  setupDatabase,
  closeDatabase,
  pool: () => pool,
  supabase: () => supabase,
};
