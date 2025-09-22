const { setupDatabase, query } = require("./database-adapter");

async function testConnection() {
  try {
    console.log("🔄 測試數據庫連接...");

    // 檢查環境變數
    console.log("📋 環境變數檢查:");
    console.log(
      "  - DATABASE_URL:",
      process.env.DATABASE_URL ? "已設置" : "未設置"
    );
    console.log(
      "  - POSTGRES_URL:",
      process.env.POSTGRES_URL ? "已設置" : "未設置"
    );
    console.log(
      "  - PGDATABASE:",
      process.env.PGDATABASE ? "已設置" : "未設置"
    );
    console.log(
      "  - RAILWAY_DATABASE_URL:",
      process.env.RAILWAY_DATABASE_URL ? "已設置" : "未設置"
    );
    console.log("  - NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "  - RAILWAY_ENVIRONMENT:",
      process.env.RAILWAY_ENVIRONMENT || "未設置"
    );

    // 初始化數據庫
    console.log("🔄 初始化數據庫...");
    await setupDatabase();
    console.log("✅ 數據庫初始化成功");

    // 測試基本查詢
    console.log("🔄 測試基本查詢...");
    const result = await query(
      "SELECT NOW() as current_time, version() as postgres_version"
    );
    console.log("✅ 查詢成功:");
    console.log("  - 當前時間:", result.rows[0].current_time);
    console.log("  - PostgreSQL版本:", result.rows[0].postgres_version);

    // 測試表格查詢
    console.log("🔄 測試表格查詢...");
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log("✅ 表格查詢成功:");
    tables.rows.forEach((row) => {
      console.log("  -", row.table_name);
    });

    console.log("✅ 所有測試通過！");
    process.exit(0);
  } catch (error) {
    console.error("❌ 測試失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    process.exit(1);
  }
}

testConnection();
