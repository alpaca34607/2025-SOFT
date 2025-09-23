const { run, query } = require("./database-adapter");

async function addOrderNumberColumn() {
  try {
    console.log("🔄 開始添加 order_number 欄位...");

    // 檢查欄位是否已存在
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_number'
    `);

    if (checkColumn && checkColumn.rows && checkColumn.rows.length > 0) {
      console.log("✅ order_number 欄位已存在");
      return;
    }

    // 添加 order_number 欄位
    await run(`
      ALTER TABLE orders 
      ADD COLUMN order_number VARCHAR(50)
    `);

    console.log("✅ 成功添加 order_number 欄位");

    // 為現有訂單生成訂單編號
    const existingOrders = await run(`
      SELECT id FROM orders WHERE order_number IS NULL
    `);

    if (existingOrders && existingOrders.length > 0) {
      console.log(`🔄 為 ${existingOrders.length} 個現有訂單生成訂單編號...`);

      for (const order of existingOrders) {
        const orderNumber = `SOFT${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`;

        await run(
          `
          UPDATE orders 
          SET order_number = ? 
          WHERE id = ?
        `,
          [orderNumber, order.id]
        );
      }

      console.log("✅ 完成現有訂單編號生成");
    }

    // 設置 NOT NULL 約束
    await run(`
      ALTER TABLE orders 
      ALTER COLUMN order_number SET NOT NULL
    `);

    // 添加唯一約束
    await run(`
      ALTER TABLE orders 
      ADD CONSTRAINT unique_order_number UNIQUE (order_number)
    `);

    // 創建索引
    await run(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)
    `);

    console.log("✅ 成功完成 order_number 欄位遷移");
  } catch (error) {
    console.error("❌ 遷移失敗:", error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  addOrderNumberColumn()
    .then(() => {
      console.log("🎉 遷移完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 遷移失敗:", error);
      process.exit(1);
    });
}

module.exports = { addOrderNumberColumn };
