const { run, query } = require("./database-adapter");

async function addPaymentPickupColumns() {
  try {
    console.log("🔄 開始添加 payment_method 和 pickup_method 欄位...");

    // 檢查 payment_method 欄位是否已存在
    const checkPaymentMethod = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_method'
    `);

    // 檢查 pickup_method 欄位是否已存在
    const checkPickupMethod = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'pickup_method'
    `);

    if (
      checkPaymentMethod &&
      checkPaymentMethod.rows &&
      checkPaymentMethod.rows.length > 0
    ) {
      console.log("✅ payment_method 欄位已存在");
    } else {
      // 添加 payment_method 欄位
      await run(`
        ALTER TABLE orders 
        ADD COLUMN payment_method VARCHAR(50)
      `);
      console.log("✅ 成功添加 payment_method 欄位");
    }

    if (
      checkPickupMethod &&
      checkPickupMethod.rows &&
      checkPickupMethod.rows.length > 0
    ) {
      console.log("✅ pickup_method 欄位已存在");
    } else {
      // 添加 pickup_method 欄位
      await run(`
        ALTER TABLE orders 
        ADD COLUMN pickup_method VARCHAR(100)
      `);
      console.log("✅ 成功添加 pickup_method 欄位");
    }

    console.log("✅ 成功完成 payment_method 和 pickup_method 欄位遷移");
  } catch (error) {
    console.error("❌ 遷移失敗:", error);
    throw error;
  }
}

module.exports = { addPaymentPickupColumns };
