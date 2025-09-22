const { run, query } = require("./database-adapter");

/**
 * 修復 order_number 欄位為 NOT NULL
 * 確保所有現有記錄都有 order_number，並設置欄位為 NOT NULL
 */
async function fixOrderNumberNullable() {
  try {
    console.log("🔄 開始修復 order_number 欄位...");

    // 1. 檢查 order_number 欄位當前狀態
    const checkColumn = await query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_number'
    `);

    if (checkColumn && checkColumn.rows && checkColumn.rows.length > 0) {
      const columnInfo = checkColumn.rows[0];
      console.log(`📋 order_number 欄位當前狀態:`);
      console.log(`   - 是否可為空: ${columnInfo.is_nullable}`);
      console.log(`   - 預設值: ${columnInfo.column_default || "無"}`);
    }

    // 2. 檢查是否有空的 order_number 記錄
    const emptyOrderNumbers = await query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE order_number IS NULL OR order_number = ''
    `);

    const emptyCount = emptyOrderNumbers.rows[0].count;
    console.log(`📋 發現 ${emptyCount} 筆記錄的 order_number 為空`);

    // 3. 為空的 order_number 記錄生成新的訂單號
    if (emptyCount > 0) {
      console.log("🔧 為空的 order_number 記錄生成新的訂單號...");

      const emptyRecords = await query(`
        SELECT id, created_at 
        FROM orders 
        WHERE order_number IS NULL OR order_number = ''
        ORDER BY created_at
      `);

      for (const record of emptyRecords.rows) {
        // 生成新的訂單號
        const timestamp = new Date(record.created_at).getTime();
        const randomSuffix = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const newOrderNumber = `SOFT${timestamp}${randomSuffix}`;

        console.log(`🔄 更新記錄 ${record.id}: ${newOrderNumber}`);

        await run(
          `
          UPDATE orders 
          SET order_number = ? 
          WHERE id = ?
        `,
          [newOrderNumber, record.id]
        );
      }

      console.log("✅ 空的 order_number 記錄已更新");
    }

    // 4. 設置 order_number 欄位為 NOT NULL
    console.log("🔧 設置 order_number 欄位為 NOT NULL...");
    await run(`
      ALTER TABLE orders 
      ALTER COLUMN order_number SET NOT NULL
    `);
    console.log("✅ order_number 欄位已設置為 NOT NULL");

    // 5. 添加唯一約束（如果不存在）
    try {
      await run(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number)
      `);
      console.log("✅ order_number 唯一約束已添加");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("✅ order_number 唯一約束已存在");
      } else {
        throw error;
      }
    }

    // 6. 驗證修復結果
    const verifyColumn = await query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_number'
    `);

    if (verifyColumn && verifyColumn.rows && verifyColumn.rows.length > 0) {
      const columnInfo = verifyColumn.rows[0];
      console.log(`✅ 修復後的 order_number 欄位狀態:`);
      console.log(`   - 是否可為空: ${columnInfo.is_nullable}`);
      console.log(`   - 預設值: ${columnInfo.column_default || "無"}`);
    }

    console.log("✅ order_number 欄位修復完成");
    return true;
  } catch (error) {
    console.error("❌ 修復 order_number 欄位失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

module.exports = { fixOrderNumberNullable };
