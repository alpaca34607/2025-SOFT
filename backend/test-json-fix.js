const { setupDatabase, query, run } = require("./database-adapter");

async function testJsonFix() {
  try {
    console.log("🔄 測試JSON修復...");

    // 初始化數據庫
    await setupDatabase();

    // 測試數據
    const testData = {
      main_colors: ["black", "white"],
      sub_colors: [
        "gold",
        "silver",
        "bronze",
        "red",
        "orange",
        "yellow",
        "blue",
        "green",
      ],
    };

    console.log("📋 測試數據:");
    console.log("  - main_colors:", testData.main_colors);
    console.log("  - sub_colors:", testData.sub_colors);

    // 測試JSON轉換
    const mainColorsJson = testData.main_colors
      ? JSON.stringify(testData.main_colors)
      : "[]";
    const subColorsJson = testData.sub_colors
      ? JSON.stringify(testData.sub_colors)
      : "[]";

    console.log("📋 JSON轉換結果:");
    console.log("  - mainColorsJson:", mainColorsJson);
    console.log("  - subColorsJson:", subColorsJson);

    // 驗證JSON格式
    try {
      const parsedMain = JSON.parse(mainColorsJson);
      const parsedSub = JSON.parse(subColorsJson);
      console.log("✅ JSON格式驗證成功");
      console.log("  - 解析後的main_colors:", parsedMain);
      console.log("  - 解析後的sub_colors:", parsedSub);
    } catch (error) {
      console.error("❌ JSON格式驗證失敗:", error.message);
      return false;
    }

    // 測試數據庫插入
    console.log("🔄 測試數據庫插入...");
    const testProductId = `test-product-${Date.now()}`;

    await run(
      `
      INSERT INTO products (
        product_id, name, price, deposit, max_quantity, status,
        main_colors, sub_colors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        testProductId,
        "測試產品",
        1000,
        200,
        1,
        "available",
        mainColorsJson,
        subColorsJson,
      ]
    );

    console.log("✅ 數據庫插入成功");

    // 測試數據庫查詢
    console.log("🔄 測試數據庫查詢...");
    const result = await query("SELECT * FROM products WHERE product_id = ?", [
      testProductId,
    ]);

    if (result.rows && result.rows.length > 0) {
      const product = result.rows[0];
      console.log("✅ 數據庫查詢成功");
      console.log("  - 產品名稱:", product.name);
      console.log("  - main_colors:", product.main_colors);
      console.log("  - sub_colors:", product.sub_colors);

      // 驗證查詢結果的JSON格式
      try {
        const parsedMain = JSON.parse(product.main_colors);
        const parsedSub = JSON.parse(product.sub_colors);
        console.log("✅ 查詢結果JSON解析成功");
        console.log("  - 解析後的main_colors:", parsedMain);
        console.log("  - 解析後的sub_colors:", parsedSub);
      } catch (error) {
        console.error("❌ 查詢結果JSON解析失敗:", error.message);
        return false;
      }
    }

    // 清理測試數據
    console.log("🔄 清理測試數據...");
    await run("DELETE FROM products WHERE product_id = ?", [testProductId]);
    console.log("✅ 測試數據已清理");

    console.log("✅ JSON修復測試完成");
    return true;
  } catch (error) {
    console.error("❌ JSON修復測試失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  testJsonFix().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testJsonFix };
