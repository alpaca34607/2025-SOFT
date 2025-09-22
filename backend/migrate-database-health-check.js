const { run, query } = require("./database-adapter");

/**
 * 數據庫健康檢查
 * 檢查數據庫連接、表格結構、數據完整性
 */
async function databaseHealthCheck() {
  try {
    console.log("🔄 開始數據庫健康檢查...");

    // 1. 基本連接測試
    console.log("1️⃣ 測試數據庫連接...");
    const connectionTest = await query(
      "SELECT NOW() as current_time, version() as postgres_version"
    );
    if (
      connectionTest &&
      connectionTest.rows &&
      connectionTest.rows.length > 0
    ) {
      console.log("✅ 數據庫連接正常");
      console.log(`   - 當前時間: ${connectionTest.rows[0].current_time}`);
      console.log(
        `   - PostgreSQL版本: ${connectionTest.rows[0].postgres_version}`
      );
    } else {
      throw new Error("數據庫連接失敗");
    }

    // 2. 檢查表格是否存在
    console.log("2️⃣ 檢查表格結構...");
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesCheck && tablesCheck.rows) {
      console.log(`✅ 發現 ${tablesCheck.rows.length} 個表格:`);
      tablesCheck.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // 3. 檢查products表格結構
    console.log("3️⃣ 檢查products表格結構...");
    const productsColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);

    if (productsColumns && productsColumns.rows) {
      console.log(`✅ products表格有 ${productsColumns.rows.length} 個欄位:`);
      productsColumns.rows.forEach((row) => {
        console.log(
          `   - ${row.column_name}: ${row.data_type} (${
            row.is_nullable === "YES" ? "nullable" : "not null"
          })`
        );
      });
    } else {
      console.log("⚠️ products表格不存在或無法訪問");
    }

    // 4. 檢查orders表格結構
    console.log("4️⃣ 檢查orders表格結構...");
    const ordersColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    if (ordersColumns && ordersColumns.rows) {
      console.log(`✅ orders表格有 ${ordersColumns.rows.length} 個欄位:`);
      ordersColumns.rows.forEach((row) => {
        console.log(
          `   - ${row.column_name}: ${row.data_type} (${
            row.is_nullable === "YES" ? "nullable" : "not null"
          })`
        );
      });
    } else {
      console.log("⚠️ orders表格不存在或無法訪問");
    }

    // 5. 檢查數據完整性
    console.log("5️⃣ 檢查數據完整性...");
    try {
      const productsCount = await query(
        "SELECT COUNT(*) as count FROM products"
      );
      if (productsCount && productsCount.rows) {
        console.log(`✅ products表格有 ${productsCount.rows[0].count} 筆記錄`);
      }
    } catch (error) {
      console.log("⚠️ 無法查詢products數據:", error.message);
    }

    try {
      const ordersCount = await query("SELECT COUNT(*) as count FROM orders");
      if (ordersCount && ordersCount.rows) {
        console.log(`✅ orders表格有 ${ordersCount.rows[0].count} 筆記錄`);
      }
    } catch (error) {
      console.log("⚠️ 無法查詢orders數據:", error.message);
    }

    // 6. 檢查觸發器狀態
    console.log("6️⃣ 檢查觸發器狀態...");
    const triggersCheck = await query(`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    if (triggersCheck && triggersCheck.rows && triggersCheck.rows.length > 0) {
      console.log(`⚠️ 發現 ${triggersCheck.rows.length} 個觸發器:`);
      triggersCheck.rows.forEach((row) => {
        console.log(
          `   - ${row.trigger_name} on ${row.event_object_table} (${row.action_timing} ${row.event_manipulation})`
        );
      });
    } else {
      console.log("✅ 沒有發現觸發器");
    }

    // 7. 檢查函數狀態
    console.log("7️⃣ 檢查函數狀態...");
    const functionsCheck = await query(`
      SELECT proname, prosrc
      FROM pg_proc 
      WHERE proname LIKE '%updated_at%' OR proname LIKE '%trigger%'
    `);

    if (
      functionsCheck &&
      functionsCheck.rows &&
      functionsCheck.rows.length > 0
    ) {
      console.log(`⚠️ 發現 ${functionsCheck.rows.length} 個相關函數:`);
      functionsCheck.rows.forEach((row) => {
        console.log(`   - ${row.proname}`);
      });
    } else {
      console.log("✅ 沒有發現相關函數");
    }

    console.log("✅ 數據庫健康檢查完成");
    return true;
  } catch (error) {
    console.error("❌ 數據庫健康檢查失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

module.exports = { databaseHealthCheck };
