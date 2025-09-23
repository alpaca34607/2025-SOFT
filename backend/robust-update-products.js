const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// 資料庫路徑 (Vercel 環境使用 /tmp 目錄，Railway 使用持久化目錄)
const dbPath = (() => {
  if (process.env.NODE_ENV === "production") {
    return "/tmp/database.sqlite"; // Vercel
  } else if (process.env.RAILWAY_ENVIRONMENT) {
    return path.join(__dirname, "database.sqlite"); // Railway
  } else {
    return path.join(__dirname, "database.sqlite"); // 本地開發
  }
})();

console.log("🔍 資料庫路徑:", dbPath);
console.log("🔍 環境變數 NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 Railway 環境:", process.env.RAILWAY_ENVIRONMENT || "未設定");

// 確保資料庫目錄存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log("📁 建立資料庫目錄:", dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}

// 檢查資料庫檔案是否存在
if (!fs.existsSync(dbPath)) {
  console.log("📄 資料庫檔案不存在，將在初始化時創建:", dbPath);
}

// 建立資料庫連接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ 資料庫連接失敗:", err.message);
    process.exit(1);
  } else {
    console.log("✅ 成功連接到 SQLite 資料庫");
  }
});

async function updateProducts() {
  try {
    console.log("🔄 開始更新商品資料...");

    // 先檢查資料庫表格是否存在
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(
      "📋 資料庫表格:",
      tables.map((t) => t.name)
    );

    if (!tables.find((t) => t.name === "products")) {
      console.error("❌ products 表格不存在");
      process.exit(1);
    }

    // 商品資料
    const products = [
      {
        product_id: "product-Remain",
        name: "餘量釋出|軟吉拉公仔",
        price: 1200,
        deposit: 300,
        max_quantity: 3,
        status: "available",
        preorder_button_status: "select_style",
        cell_open_status: "preparing",
        cell_remaining_status: "still_available",
        specifications: "3D列印手工打磨噴色製作",
        pickup_info: "展場取貨為主，請考量自身是否方便前往展場繳納尾款並取貨",
        thumbnail_path: "/images/shop/product-Softzilla-bluewhite-front.jpg",
        lightslider_images: JSON.stringify([
          "/images/shop/product-Softzilla-bluewhite-front.jpg",
          "/images/shop/product-Softzilla-bluewhite-back.jpg",
          "/images/shop/product-Softzilla-blueblack-front.jpg",
          "/images/shop/product-Softzilla-blueblack-back.jpg",
          "/images/shop/product-Softzilla-redblack.jpg",
          "/images/shop/product-Softzilla-greenblack.jpg",
        ]),
        sketchfab_embed_link:
          "https://sketchfab.com/models/b70dd5e325d04d17929dd6ff7bd222b0/embed",
        sketchfab_background: "/images/shop/Softzilla-longAD.jpg",
        main_colors: JSON.stringify([
          "#4A90E2",
          "#000000",
          "#FF0000",
          "#00FF00",
        ]),
        sub_colors: JSON.stringify(["#FFFFFF", "#CCCCCC"]),
      },
      {
        product_id: "product-Soft",
        name: "2019出品 | 軟筋臥佛公仔",
        price: 800,
        deposit: 200,
        max_quantity: 3,
        status: "available",
        preorder_button_status: "select_style",
        cell_open_status: "preparing",
        cell_remaining_status: "still_available",
        specifications: "3D列印手工打磨噴色製作",
        pickup_info: "展場取貨為主",
        thumbnail_path: "/images/shop/product-Soft-front.jpg",
        lightslider_images: JSON.stringify([
          "/images/shop/product-Soft-front.jpg",
          "/images/shop/product-Soft-back.jpg",
        ]),
        sketchfab_embed_link:
          "https://sketchfab.com/models/7b4108446c8949cf839a21f37ff261fa/embed",
        sketchfab_background: "/images/shop/Softzilla-longAD-2.jpg",
        main_colors: JSON.stringify(["#FFD700", "#8B4513"]),
        sub_colors: JSON.stringify(["#FFFFFF", "#CCCCCC"]),
      },
      {
        product_id: "product-SoftzillaOD",
        name: "監修中 | 戶外風軟吉拉",
        price: 1500,
        deposit: 400,
        max_quantity: 3,
        status: "available",
        preorder_button_status: "select_style",
        cell_open_status: "preparing",
        cell_remaining_status: "still_available",
        specifications: "3D列印手工打磨噴色製作",
        pickup_info: "展場取貨為主",
        thumbnail_path: "/images/shop/product-SoftzillaOD-front.jpg",
        lightslider_images: JSON.stringify([
          "/images/shop/product-SoftzillaOD-front.jpg",
          "/images/shop/product-SoftzillaOD-back.jpg",
        ]),
        sketchfab_embed_link:
          "https://sketchfab.com/models/534a5772046a4ad594d8aba768421f3d/embed",
        sketchfab_background: "/images/shop/Sketchfab_background.jpg",
        main_colors: JSON.stringify(["#228B22", "#8B4513"]),
        sub_colors: JSON.stringify(["#FFFFFF", "#CCCCCC"]),
      },
      {
        product_id: "product-Softtwice",
        name: "2018出品 | 小貓仔黏土偶",
        price: 600,
        deposit: 150,
        max_quantity: 3,
        status: "available",
        preorder_button_status: "select_style",
        cell_open_status: "preparing",
        cell_remaining_status: "still_available",
        specifications: "3D列印手工打磨噴色製作",
        pickup_info: "展場取貨為主",
        thumbnail_path: "/images/shop/product-soft-twice.JPG",
        lightslider_images: JSON.stringify([
          "/images/shop/product-soft-twice.JPG",
        ]),
        sketchfab_embed_link: "",
        sketchfab_background: "",
        main_colors: JSON.stringify(["#FF69B4", "#FFB6C1"]),
        sub_colors: JSON.stringify(["#FFFFFF", "#CCCCCC"]),
      },
      {
        product_id: "product-Softzilla",
        name: "2023出品|軟吉拉公仔",
        price: 1000,
        deposit: 250,
        max_quantity: 3,
        status: "available",
        preorder_button_status: "select_style",
        cell_open_status: "preparing",
        cell_remaining_status: "still_available",
        specifications: "3D列印手工打磨噴色製作",
        pickup_info: "展場取貨為主",
        thumbnail_path:
          "/images/products/thumbnail-1757659715373-201897359.jpg",
        lightslider_images: JSON.stringify([
          "/images/products/lightslider_images-1757659137467-889919293.jpg",
          "/images/products/lightslider_images-1757659137468-906267882.jpg",
          "/images/products/lightslider_images-1757659137469-921066150.jpg",
          "/images/products/lightslider_images-1757659137470-285483514.jpg",
          "/images/products/lightslider_images-1757659137470-810128025.jpg",
          "/images/products/lightslider_images-1757659137473-425415864.jpg",
        ]),
        sketchfab_embed_link: "",
        sketchfab_background:
          "/images/products/sketchfab_background-1757659137474-267403115.jpg",
        product_introduction:
          "/images/products/product_introduction-1757659137476-10238190.jpg",
        preorder_notes:
          "/images/products/preorder_notes-1757659137479-990608779.jpg",
        main_colors: JSON.stringify([
          "#4A90E2",
          "#000000",
          "#FF0000",
          "#00FF00",
        ]),
        sub_colors: JSON.stringify(["#FFFFFF", "#CCCCCC"]),
      },
    ];

    // 更新每個商品
    for (const product of products) {
      console.log(`🔄 處理商品: ${product.product_id}`);

      // 檢查商品是否存在
      const existing = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM products WHERE product_id = ?",
          [product.product_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existing) {
        // 更新現有商品
        console.log(`  📝 更新現有商品: ${product.name}`);
        await new Promise((resolve, reject) => {
          db.run(
            `
                        UPDATE products SET
                            name = ?, price = ?, deposit = ?, max_quantity = ?, status = ?,
                            preorder_button_status = ?, cell_open_status = ?, cell_remaining_status = ?,
                            specifications = ?, pickup_info = ?, thumbnail_path = ?, lightslider_images = ?,
                            sketchfab_embed_link = ?, sketchfab_background = ?, product_introduction = ?, preorder_notes = ?,
                            main_colors = ?, sub_colors = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE product_id = ?
                    `,
            [
              product.name,
              product.price,
              product.deposit,
              product.max_quantity,
              product.status,
              product.preorder_button_status,
              product.cell_open_status,
              product.cell_remaining_status,
              product.specifications,
              product.pickup_info,
              product.thumbnail_path,
              product.lightslider_images,
              product.sketchfab_embed_link,
              product.sketchfab_background,
              product.product_introduction,
              product.preorder_notes,
              product.main_colors,
              product.sub_colors,
              product.product_id,
            ],
            function (err) {
              if (err) {
                console.error(`    ❌ 更新失敗: ${err.message}`);
                reject(err);
              } else {
                console.log(`    ✅ 更新成功，影響 ${this.changes} 行`);
                resolve();
              }
            }
          );
        });
      } else {
        // 插入新商品
        console.log(`  ➕ 插入新商品: ${product.name}`);
        await new Promise((resolve, reject) => {
          db.run(
            `
                        INSERT INTO products (
                            product_id, name, price, deposit, max_quantity, status,
                            preorder_button_status, cell_open_status, cell_remaining_status,
                            specifications, pickup_info, thumbnail_path, lightslider_images,
                            sketchfab_embed_link, sketchfab_background, product_introduction, preorder_notes,
                            main_colors, sub_colors
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
            [
              product.product_id,
              product.name,
              product.price,
              product.deposit,
              product.max_quantity,
              product.status,
              product.preorder_button_status,
              product.cell_open_status,
              product.cell_remaining_status,
              product.specifications,
              product.pickup_info,
              product.thumbnail_path,
              product.lightslider_images,
              product.sketchfab_embed_link,
              product.sketchfab_background,
              product.product_introduction,
              product.preorder_notes,
              product.main_colors,
              product.sub_colors,
            ],
            function (err) {
              if (err) {
                console.error(`    ❌ 插入失敗: ${err.message}`);
                reject(err);
              } else {
                console.log(`    ✅ 插入成功，ID: ${this.lastID}`);
                resolve();
              }
            }
          );
        });
      }
    }

    // 驗證更新結果
    console.log("🔍 驗證更新結果...");
    const allProducts = await new Promise((resolve, reject) => {
      db.all(
        "SELECT product_id, name, thumbnail_path, lightslider_images, sketchfab_background FROM products",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log("📋 所有商品資料:");
    allProducts.forEach((product) => {
      console.log(`  - ${product.product_id}: ${product.name}`);
      console.log(`    縮圖: ${product.thumbnail_path || "null"}`);
      console.log(
        `    LightSlider: ${product.lightslider_images ? "有" : "null"}`
      );
      console.log(
        `    Sketchfab背景: ${product.sketchfab_background || "null"}`
      );
    });

    console.log(`🎉 成功更新 ${products.length} 個商品！`);

    // 關閉資料庫連接
    db.close();
  } catch (error) {
    console.error("❌ 更新商品失敗:", error);
    db.close();
    process.exit(1);
  }
}

updateProducts();
