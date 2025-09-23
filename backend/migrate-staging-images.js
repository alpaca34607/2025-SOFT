const { query, run } = require('./database-adapter');
const fs = require('fs');
const path = require('path');

async function migrateStagingImages() {
  try {
    console.log('🔄 開始遷移測試環境圖片...');
    
    // 取得所有商品
    const result = await query('SELECT product_id, name, thumbnail_path, lightslider_images FROM products');
    const products = result.rows || [];
    
    console.log(`📋 找到 ${products.length} 個商品`);
    
    for (const product of products) {
      console.log(`\n🔍 處理商品: ${product.product_id} - ${product.name}`);
      
      let needsUpdate = false;
      let newThumbnailPath = product.thumbnail_path;
      let newLightsliderImages = product.lightslider_images;
      
      // 檢查縮圖
      if (product.thumbnail_path && product.thumbnail_path.startsWith('/images/products/')) {
        const filename = path.basename(product.thumbnail_path);
        const localPath = path.join(__dirname, '../images/products', filename);
        
        if (fs.existsSync(localPath)) {
          console.log(`  ✅ 縮圖存在: ${filename}`);
        } else {
          console.log(`  ❌ 縮圖缺失: ${filename}`);
          // 使用預設圖片
          newThumbnailPath = '/images/shop/product-Softzilla-bluewhite-front.jpg';
          needsUpdate = true;
        }
      }
      
      // 檢查輪播圖
      if (product.lightslider_images) {
        try {
          const images = JSON.parse(product.lightslider_images);
          const validImages = [];
          
          for (const imagePath of images) {
            if (imagePath.startsWith('/images/products/')) {
              const filename = path.basename(imagePath);
              const localPath = path.join(__dirname, '../images/products', filename);
              
              if (fs.existsSync(localPath)) {
                console.log(`  ✅ 輪播圖存在: ${filename}`);
                validImages.push(imagePath);
              } else {
                console.log(`  ❌ 輪播圖缺失: ${filename}`);
              }
            } else {
              // 靜態圖片路徑，保留
              validImages.push(imagePath);
            }
          }
          
          // 如果沒有有效的輪播圖，使用預設圖片
          if (validImages.length === 0) {
            validImages.push('/images/shop/product-Softzilla-bluewhite-front.jpg');
            needsUpdate = true;
          }
          
          newLightsliderImages = JSON.stringify(validImages);
          
        } catch (e) {
          console.log(`  ❌ 輪播圖解析失敗: ${e.message}`);
        }
      }
      
      // 更新資料庫
      if (needsUpdate) {
        console.log(`  🔄 更新商品圖片路徑...`);
        await run(
          'UPDATE products SET thumbnail_path = ?, lightslider_images = ? WHERE product_id = ?',
          [newThumbnailPath, newLightsliderImages, product.product_id]
        );
        console.log(`  ✅ 商品 ${product.product_id} 圖片路徑已更新`);
      } else {
        console.log(`  ✅ 商品 ${product.product_id} 圖片路徑正常`);
      }
    }
    
    console.log('\n🎉 測試環境圖片遷移完成！');
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error);
  }
}

migrateStagingImages();
