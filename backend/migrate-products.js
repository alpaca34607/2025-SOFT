const { query, run } = require("./database-adapter");

async function migrateProducts() {
  try {
    console.log("開始遷移商品資料表...");

    // 檢查是否需要添加新欄位
    const tableInfo = await query("PRAGMA table_info(products)");
    const existingColumns = tableInfo.rows.map((row) => row.name);

    console.log("現有欄位:", existingColumns);

    // 需要添加的新欄位
    const newColumns = [
      {
        name: "preorder_button_status",
        definition:
          'TEXT CHECK(preorder_button_status IN ("select_style", "sold_out")) DEFAULT "select_style"',
      },
      {
        name: "cell_open_status",
        definition:
          'TEXT CHECK(cell_open_status IN ("preparing", "open_for_preorder", "stopped_selling")) DEFAULT "preparing"',
      },
      {
        name: "cell_remaining_status",
        definition:
          'TEXT CHECK(cell_remaining_status IN ("still_available", "sold_out")) DEFAULT "still_available"',
      },
      {
        name: "specifications",
        definition: "TEXT",
      },
      {
        name: "pickup_info",
        definition: "TEXT",
      },
      {
        name: "thumbnail_path",
        definition: "VARCHAR(500)",
      },
      {
        name: "lightslider_images",
        definition: "TEXT",
      },
      {
        name: "sketchfab_embed_link",
        definition: "TEXT",
      },
      {
        name: "sketchfab_background",
        definition: "TEXT",
      },
      {
        name: "product_introduction",
        definition: "TEXT",
      },
      {
        name: "preorder_notes",
        definition: "TEXT",
      },
    ];

    // 添加新欄位
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`添加欄位: ${column.name}`);
        await run(
          `ALTER TABLE products ADD COLUMN ${column.name} ${column.definition}`
        );
      } else {
        console.log(`欄位已存在: ${column.name}`);
      }
    }

    // 更新現有資料
    console.log("更新現有商品資料...");

    // 將 description 欄位的資料複製到 specifications
    await run(`
            UPDATE products 
            SET specifications = description 
            WHERE specifications IS NULL AND description IS NOT NULL
        `);

    // 更新 Softzilla 商品的預設資料
    await run(`
            UPDATE products 
            SET 
                specifications = '寬5cm*高8cm / 模型光固化樹脂',
                pickup_info = '2023/10月中 / Taipei Toy Festival台北國際玩具創作大展',
                preorder_button_status = 'select_style',
                cell_open_status = 'open_for_preorder',
                cell_remaining_status = 'still_available',
                sketchfab_embed_link = 'https://sketchfab.com/models/b70dd5e325d04d17929dd6ff7bd222b0/embed'
            WHERE product_id = 'product-Softzilla'
        `);

    // 更新其他商品的狀態
    await run(`
            UPDATE products 
            SET 
                preorder_button_status = CASE 
                    WHEN status = 'sold_out' THEN 'sold_out'
                    ELSE 'select_style'
                END,
                cell_open_status = CASE 
                    WHEN status = 'sold_out' THEN 'stopped_selling'
                    WHEN status = 'discontinued' THEN 'stopped_selling'
                    ELSE 'open_for_preorder'
                END,
                cell_remaining_status = CASE 
                    WHEN status = 'sold_out' THEN 'sold_out'
                    ELSE 'still_available'
                END
        `);

    console.log("遷移完成！");

    // 顯示更新後的資料
    const products = await query(
      "SELECT product_id, name, specifications, pickup_info, preorder_button_status, cell_open_status, cell_remaining_status FROM products"
    );
    console.log("更新後的商品資料:");
    products.rows.forEach((product) => {
      console.log(`- ${product.product_id}: ${product.name}`);
      console.log(`  規格: ${product.specifications || "未設定"}`);
      console.log(`  取貨資訊: ${product.pickup_info || "未設定"}`);
      console.log(`  預購按鈕狀態: ${product.preorder_button_status}`);
      console.log(`  開放狀態: ${product.cell_open_status}`);
      console.log(`  餘量狀態: ${product.cell_remaining_status}`);
      console.log("");
    });
  } catch (error) {
    console.error("遷移失敗:", error);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  migrateProducts()
    .then(() => {
      console.log("遷移腳本執行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("遷移腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = { migrateProducts };
