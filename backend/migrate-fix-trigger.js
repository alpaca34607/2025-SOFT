const { run, query } = require("./database-adapter");

/**
 * 修復觸發器相關問題
 * 1. 刪除可能損壞的觸發器函數
 * 2. 刪除相關觸發器
 * 3. 確保數據庫狀態正常
 */
async function fixTriggerIssues() {
  try {
    console.log("🔄 開始修復觸發器問題...");

    // 1. 檢查是否存在損壞的觸發器函數
    const checkFunction = await query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'update_updated_at_column'
    `);

    if (checkFunction && checkFunction.rows && checkFunction.rows.length > 0) {
      console.log("📋 發現 update_updated_at_column 函數，嘗試刪除...");

      // 先刪除相關觸發器
      try {
        await run(
          `DROP TRIGGER IF EXISTS update_products_updated_at ON products`
        );
        console.log("✅ 刪除 products 觸發器");
      } catch (error) {
        console.log("⚠️ 刪除 products 觸發器失敗:", error.message);
      }

      try {
        await run(`DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`);
        console.log("✅ 刪除 orders 觸發器");
      } catch (error) {
        console.log("⚠️ 刪除 orders 觸發器失敗:", error.message);
      }

      try {
        await run(
          `DROP TRIGGER IF EXISTS update_customers_updated_at ON customers`
        );
        console.log("✅ 刪除 customers 觸發器");
      } catch (error) {
        console.log("⚠️ 刪除 customers 觸發器失敗:", error.message);
      }

      // 刪除函數
      try {
        await run(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
        console.log("✅ 刪除 update_updated_at_column 函數");
      } catch (error) {
        console.log("⚠️ 刪除函數失敗:", error.message);
      }
    } else {
      console.log("✅ 沒有發現 update_updated_at_column 函數");
    }

    // 2. 檢查是否有其他損壞的觸發器
    const checkTriggers = await query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%updated_at%'
    `);

    if (checkTriggers && checkTriggers.rows && checkTriggers.rows.length > 0) {
      console.log(
        `📋 發現 ${checkTriggers.rows.length} 個 updated_at 相關觸發器`
      );

      for (const trigger of checkTriggers.rows) {
        try {
          await run(
            `DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON ${trigger.event_object_table}`
          );
          console.log(`✅ 刪除觸發器: ${trigger.trigger_name}`);
        } catch (error) {
          console.log(
            `⚠️ 刪除觸發器 ${trigger.trigger_name} 失敗:`,
            error.message
          );
        }
      }
    } else {
      console.log("✅ 沒有發現 updated_at 相關觸發器");
    }

    // 3. 檢查數據庫連接狀態
    try {
      await query("SELECT NOW()");
      console.log("✅ 數據庫連接正常");
    } catch (error) {
      console.error("❌ 數據庫連接異常:", error.message);
      return false;
    }

    console.log("✅ 觸發器問題修復完成");
    return true;
  } catch (error) {
    console.error("❌ 修復觸發器問題失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

module.exports = { fixTriggerIssues };
