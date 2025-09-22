const { run, query } = require("./database-adapter");

/**
 * 修復圖片欄位類型不匹配問題
 * 1. 將 product_introduction 從 TEXT 改為 VARCHAR(500) (用於存儲圖片路徑)
 * 2. 將 image_path 的數據遷移到 thumbnail_path (統一使用 thumbnail_path)
 * 3. 刪除未使用的 image_path 欄位
 */
async function fixImageFields() {
  try {
    console.log("🔄 開始修復圖片欄位...");

    // 1. 檢查 product_introduction 欄位類型
    const checkIntroColumn = await query(`
      SELECT data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'product_introduction'
    `);

    if (
      checkIntroColumn &&
      checkIntroColumn.rows &&
      checkIntroColumn.rows.length > 0
    ) {
      const columnInfo = checkIntroColumn.rows[0];
      console.log(
        `📋 product_introduction 當前類型: ${columnInfo.data_type} (${
          columnInfo.character_maximum_length || "unlimited"
        })`
      );

      if (columnInfo.data_type === "text") {
        console.log("🔧 將 product_introduction 從 TEXT 改為 VARCHAR(500)...");
        await run(`
          ALTER TABLE products 
          ALTER COLUMN product_introduction TYPE VARCHAR(500)
        `);
        console.log("✅ product_introduction 欄位類型已修復");
      } else {
        console.log("✅ product_introduction 欄位類型已正確");
      }
    }

    // 2. 檢查是否有 image_path 數據需要遷移
    const checkImagePathData = await query(`
      SELECT product_id, image_path, thumbnail_path 
      FROM products 
      WHERE image_path IS NOT NULL AND image_path != ''
    `);

    if (
      checkImagePathData &&
      checkImagePathData.rows &&
      checkImagePathData.rows.length > 0
    ) {
      console.log(
        `📋 發現 ${checkImagePathData.rows.length} 個產品有 image_path 數據需要遷移`
      );

      for (const row of checkImagePathData.rows) {
        // 如果 thumbnail_path 為空，則將 image_path 遷移過去
        if (!row.thumbnail_path || row.thumbnail_path === "") {
          console.log(
            `🔄 遷移 ${row.product_id}: ${row.image_path} -> thumbnail_path`
          );
          await run(
            `
            UPDATE products 
            SET thumbnail_path = ? 
            WHERE product_id = ?
          `,
            [row.image_path, row.product_id]
          );
        } else {
          console.log(`⚠️ ${row.product_id} 已有 thumbnail_path，跳過遷移`);
        }
      }
      console.log("✅ image_path 數據遷移完成");
    } else {
      console.log("✅ 沒有需要遷移的 image_path 數據");
    }

    // 3. 檢查 image_path 欄位是否還在使用
    const checkImagePathUsage = await query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE image_path IS NOT NULL AND image_path != ''
    `);

    const usageCount = checkImagePathUsage.rows[0].count;
    if (usageCount == 0) {
      console.log("🔧 刪除未使用的 image_path 欄位...");
      await run(`
        ALTER TABLE products DROP COLUMN image_path
      `);
      console.log("✅ image_path 欄位已刪除");
    } else {
      console.log(`⚠️ image_path 欄位仍有 ${usageCount} 個值在使用，保留欄位`);
    }

    console.log("✅ 圖片欄位修復完成");
    return true;
  } catch (error) {
    console.error("❌ 修復圖片欄位失敗:", error);
    console.error("錯誤堆疊:", error.stack);
    return false;
  }
}

module.exports = { fixImageFields };
