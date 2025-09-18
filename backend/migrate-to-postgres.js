/**
 * 從 SQLite 遷移到 PostgreSQL 的腳本
 * 使用方法：node migrate-to-postgres.js
 */

const sqlite3 = require("sqlite3").verbose();
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

// SQLite 資料庫路徑
const sqlitePath =
  process.env.NODE_ENV === "staging"
    ? "/data/database.sqlite"
    : path.join(__dirname, "database.sqlite");

async function migrateToPostgres() {
  console.log("🔄 開始從 SQLite 遷移到 PostgreSQL...");

  // 檢查 SQLite 檔案是否存在
  if (!fs.existsSync(sqlitePath)) {
    console.error("❌ SQLite 資料庫檔案不存在:", sqlitePath);
    return;
  }

  // 建立 PostgreSQL 連接
  const pgPool = new Pool(pgConfig);

  try {
    // 測試 PostgreSQL 連接
    await pgPool.query("SELECT NOW()");
    console.log("✅ PostgreSQL 連接成功");
  } catch (error) {
    console.error("❌ PostgreSQL 連接失敗:", error.message);
    return;
  }

  // 建立 SQLite 連接
  const sqliteDb = new sqlite3.Database(sqlitePath);

  try {
    // 1. 遷移產品資料
    console.log("📦 遷移產品資料...");
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM products", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const product of products) {
      await pgPool.query(
        `
        INSERT INTO products (
          product_id, name, price, deposit, max_quantity, status,
          preorder_button_status, cell_open_status, cell_remaining_status,
          specifications, pickup_info, thumbnail_path, lightslider_images,
          sketchfab_embed_link, sketchfab_background, product_introduction,
          preorder_notes, main_colors, sub_colors, image_path,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (product_id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          deposit = EXCLUDED.deposit,
          max_quantity = EXCLUDED.max_quantity,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `,
        [
          product.product_id,
          product.name,
          product.price,
          product.deposit,
          product.max_quantity,
          product.status,
          product.preorder_button_status,
          product.cell_open_status,
          product.cell_remaining_status,
          product.specifications,
          product.pickup_info,
          product.thumbnail_path,
          JSON.stringify(product.lightslider_images),
          product.sketchfab_embed_link,
          product.sketchfab_background,
          product.product_introduction,
          product.preorder_notes,
          JSON.stringify(product.main_colors),
          JSON.stringify(product.sub_colors),
          product.image_path,
          product.created_at,
          product.updated_at,
        ]
      );
    }
    console.log(`✅ 已遷移 ${products.length} 個產品`);

    // 2. 遷移訂單資料
    console.log("📋 遷移訂單資料...");
    const orders = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM orders", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const order of orders) {
      await pgPool.query(
        `
        INSERT INTO orders (
          id, customer_name, customer_phone, customer_email, order_items,
          total_amount, deposit_amount, status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `,
        [
          order.id,
          order.customer_name,
          order.customer_phone,
          order.customer_email,
          JSON.stringify(order.order_items),
          order.total_amount,
          order.deposit_amount,
          order.status,
          order.notes,
          order.created_at,
          order.updated_at,
        ]
      );
    }
    console.log(`✅ 已遷移 ${orders.length} 個訂單`);

    // 3. 遷移客戶資料
    console.log("👥 遷移客戶資料...");
    const customers = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM customers", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const customer of customers) {
      await pgPool.query(
        `
        INSERT INTO customers (
          id, name, phone, email, address, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          updated_at = EXCLUDED.updated_at
      `,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.created_at,
          customer.updated_at,
        ]
      );
    }
    console.log(`✅ 已遷移 ${customers.length} 個客戶`);

    console.log("🎉 遷移完成！");
  } catch (error) {
    console.error("❌ 遷移過程中發生錯誤:", error);
  } finally {
    // 關閉連接
    sqliteDb.close();
    await pgPool.end();
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  migrateToPostgres().catch(console.error);
}

module.exports = { migrateToPostgres };
