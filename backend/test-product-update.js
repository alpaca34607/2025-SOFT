const { query, run } = require("./database-adapter");

async function testProductUpdate() {
  try {
    console.log("🔄 測試產品更新功能...");

    // 1. 獲取一個現有產品
    const products = await query("SELECT * FROM products LIMIT 1");
    if (!products.rows || products.rows.length === 0) {
      console.log("❌ 沒有找到產品進行測試");
      return false;
    }

    const product = products.rows[0];
    console.log(`📋 測試產品: ${product.name} (${product.product_id})`);

    // 2. 測試更新產品名稱
    const originalName = product.name;
    const testName = `${originalName} - 測試更新 ${Date.now()}`;

    console.log("🔄 更新產品名稱...");
    const updateResult = await run(
      `
      UPDATE products 
      SET name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE product_id = ?
    `,
      [testName, product.product_id]
    );

    if (updateResult.changes > 0) {
      console.log("✅ 產品名稱更新成功");
    } else {
      console.log("❌ 產品名稱更新失敗");
      return false;
    }

    // 3. 驗證更新結果
    const updatedProduct = await query(
      "SELECT * FROM products WHERE product_id = ?",
      [product.product_id]
    );
    if (updatedProduct.rows && updatedProduct.rows.length > 0) {
      const updated = updatedProduct.rows[0];
      console.log(`✅ 驗證更新結果: ${updated.name}`);

      if (updated.name === testName) {
        console.log("✅ 產品更新功能正常");
      } else {
        console.log("❌ 產品更新結果不正確");
        return false;
      }
    }

    // 4. 恢復原始名稱
    console.log("🔄 恢復原始產品名稱...");
    await run(
      `
      UPDATE products 
      SET name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE product_id = ?
    `,
      [originalName, product.product_id]
    );
    console.log("✅ 原始名稱已恢復");

    // 5. 測試圖片欄位更新
    console.log("🔄 測試圖片欄位更新...");
    const testImagePath =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A";

    await run(
      `
      UPDATE products 
      SET thumbnail_path = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE product_id = ?
    `,
      [testImagePath, product.product_id]
    );
    console.log("✅ 圖片欄位更新成功");

    // 6. 驗證圖片欄位更新
    const imageUpdatedProduct = await query(
      "SELECT thumbnail_path FROM products WHERE product_id = ?",
      [product.product_id]
    );
    if (imageUpdatedProduct.rows && imageUpdatedProduct.rows.length > 0) {
      const thumbnailPath = imageUpdatedProduct.rows[0].thumbnail_path;
      if (thumbnailPath === testImagePath) {
        console.log("✅ 圖片欄位更新驗證成功");
      } else {
        console.log("❌ 圖片欄位更新驗證失敗");
        return false;
      }
    }

    console.log("✅ 所有產品更新測試通過！");
    return true;
  } catch (error) {
    console.error("❌ 產品更新測試失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  const { setupDatabase } = require("./database-adapter");

  async function runTest() {
    try {
      await setupDatabase();
      await testProductUpdate();
      process.exit(0);
    } catch (error) {
      console.error("❌ 測試運行失敗:", error);
      process.exit(1);
    }
  }

  runTest();
}

module.exports = { testProductUpdate };
