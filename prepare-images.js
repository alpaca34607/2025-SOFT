const fs = require('fs');
const path = require('path');

console.log('🖼️ 準備圖片檔案...');

// 檢查圖片目錄
const imagesDir = './images';
const productsDir = './images/products';
const shopDir = './images/shop';

console.log('📁 檢查圖片目錄結構:');

if (fs.existsSync(imagesDir)) {
  console.log(`✅ ${imagesDir} 存在`);
  
  if (fs.existsSync(productsDir)) {
    const productsFiles = fs.readdirSync(productsDir);
    console.log(`✅ ${productsDir} 存在，包含 ${productsFiles.length} 個檔案`);
    productsFiles.slice(0, 5).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (productsFiles.length > 5) {
      console.log(`  ... 還有 ${productsFiles.length - 5} 個檔案`);
    }
  } else {
    console.log(`❌ ${productsDir} 不存在`);
  }
  
  if (fs.existsSync(shopDir)) {
    const shopFiles = fs.readdirSync(shopDir);
    console.log(`✅ ${shopDir} 存在，包含 ${shopFiles.length} 個檔案`);
  } else {
    console.log(`❌ ${shopDir} 不存在`);
  }
} else {
  console.log(`❌ ${imagesDir} 不存在`);
}

// 統計所有圖片檔案
let totalImages = 0;
function countImages(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      countImages(filePath);
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
      totalImages++;
    }
  });
}

countImages(imagesDir);
console.log(`📊 總共找到 ${totalImages} 個圖片檔案`);

console.log('✅ 圖片準備完成！');
