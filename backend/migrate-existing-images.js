const { query, run } = require("./database-adapter");

async function migrateExistingImages() {
  try {
    console.log("開始遷移現有商品圖片到資料庫...");

    // 從HTML檔案中提取的圖片路徑
    const productImages = {
      "product-Remain": {
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
      },
      "product-Soft": {
        thumbnail_path: "/images/shop/product-Soft-front.jpg",
        lightslider_images: JSON.stringify([
          "/images/shop/product-Soft-front.jpg",
          "/images/shop/product-Soft-back.jpg",
        ]),
        sketchfab_embed_link:
          "https://sketchfab.com/models/7b4108446c8949cf839a21f37ff261fa/embed",
        sketchfab_background: "/images/shop/Softzilla-longAD-2.jpg",
      },
      "product-SoftzillaOD": {
        thumbnail_path: "/images/shop/product-SoftzillaOD-front.jpg",
        lightslider_images: JSON.stringify([
          "/images/shop/product-SoftzillaOD-front.jpg",
          "/images/shop/product-SoftzillaOD-back.jpg",
        ]),
        sketchfab_embed_link:
          "https://sketchfab.com/models/534a5772046a4ad594d8aba768421f3d/embed",
        sketchfab_background: "/images/shop/Sketchfab_background.jpg",
      },
      "product-Softtwice": {
        thumbnail_path: "/images/shop/product-soft-twice.JPG",
        lightslider_images: JSON.stringify([
          "/images/shop/product-soft-twice.JPG",
        ]),
        sketchfab_embed_link: null,
        sketchfab_background: null,
      },
    };

    // 更新每個商品的圖片路徑
    for (const [productId, images] of Object.entries(productImages)) {
      console.log(`更新商品 ${productId} 的圖片路徑...`);

      const updateQuery = `
                UPDATE products 
                SET 
                    thumbnail_path = ?,
                    lightslider_images = ?,
                    sketchfab_embed_link = ?,
                    sketchfab_background = ?
                WHERE product_id = ?
            `;

      await run(updateQuery, [
        images.thumbnail_path,
        images.lightslider_images,
        images.sketchfab_embed_link,
        images.sketchfab_background,
        productId,
      ]);

      console.log(`商品 ${productId} 圖片路徑更新完成`);
    }

    console.log("所有商品圖片路徑遷移完成！");

    // 顯示更新後的結果
    const products = await query(
      "SELECT product_id, name, thumbnail_path, lightslider_images, sketchfab_embed_link, sketchfab_background FROM products"
    );
    console.log("更新後的商品圖片資料:");
    products.rows.forEach((product) => {
      console.log(`- ${product.product_id}: ${product.name}`);
      console.log(`  縮圖: ${product.thumbnail_path || "未設定"}`);
      console.log(
        `  LightSlider圖片: ${
          product.lightslider_images
            ? JSON.parse(product.lightslider_images).length + "張"
            : "未設定"
        }`
      );
      console.log(
        `  Sketchfab連結: ${product.sketchfab_embed_link || "未設定"}`
      );
      console.log(
        `  Sketchfab背景: ${product.sketchfab_background || "未設定"}`
      );
      console.log("");
    });
  } catch (error) {
    console.error("遷移失敗:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateExistingImages()
    .then(() => {
      console.log("圖片遷移腳本執行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("圖片遷移腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = { migrateExistingImages };
