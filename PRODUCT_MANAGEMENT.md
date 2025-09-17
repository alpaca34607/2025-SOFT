# 商品管理功能說明

## 功能概述

後台商品管理系統現在支援完整的商品 CRUD 操作，包括：

### 1. 商品資訊管理
- ✅ 新增商品
- ✅ 編輯商品資訊
- ✅ 刪除商品
- ✅ 商品狀態管理（可購買/已售完/已停售）
- ✅ 庫存數量管理

### 2. 商品詳細資訊
- ✅ 商品名稱
- ✅ 價格設定
- ✅ 訂金設定
- ✅ 商品描述
- ✅ 主色選項配置
- ✅ 副色選項配置
- ✅ 商品圖片上傳

### 3. 圖片管理
- ✅ 支援 JPG、PNG、GIF、WebP 格式
- ✅ 檔案大小限制 5MB
- ✅ 自動刪除舊圖片
- ✅ 圖片預覽功能

### 4. 前端同步
- ✅ 自動生成前端商品配置
- ✅ 一鍵更新前端 shopping.js 檔案
- ✅ 手動複製配置選項

## 使用方式

### 1. 進入商品管理
1. 開啟後台管理頁面 (`admin.html`)
2. 點擊「商品管理」標籤
3. 可以看到所有商品的列表

### 2. 新增商品
1. 點擊「新增商品」按鈕
2. 填寫商品資訊：
   - **商品ID**: 唯一識別碼（如：product-new-item）
   - **商品名稱**: 顯示名稱
   - **價格**: 商品價格
   - **訂金**: 預購訂金
   - **最大數量**: 可購買數量（0 表示售完）
   - **狀態**: 商品狀態
   - **描述**: 商品詳細描述
   - **主色選項**: JSON 格式（如：["black", "white"]）
   - **副色選項**: JSON 格式（如：["red", "blue", "green"]）
   #前端顏色
     const COLOR_NAMES = {
        'black': '黑色',
        'white': '白色',
        'gray': '灰色',
        'gold': '金色',
        'silver': '銀色',
        'bronze': '銅色',
        'red': '紅色',
        'orange': '橙色',
        'yellow': '黃色',
        'blue': '藍色',
        'green': '綠色',
        'brown':'棕色',
        'none':'無顏色選項',
    };
   - **商品圖片**: 選擇圖片檔案
3. 點擊「新增商品」提交

### 3. 編輯商品
1. 在商品列表中點擊「編輯」按鈕
2. 修改商品資訊
3. 點擊「更新商品」提交

### 4. 刪除商品
1. 在商品列表中點擊「刪除」按鈕
2. 確認刪除操作
3. 商品和相關圖片會被永久刪除

### 5. 同步前端配置
1. 點擊「同步前端配置」按鈕
2. 選擇是否直接更新檔案：
   - **是**: 自動更新 `js/shopping.js` 檔案
   - **否**: 顯示配置內容供手動複製

## 資料庫結構

### products 表格
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL,
    deposit INTEGER NOT NULL,
    max_quantity INTEGER DEFAULT 3,
    status TEXT CHECK(status IN ('available', 'sold_out', 'discontinued')) DEFAULT 'available',
    description TEXT,
    main_colors TEXT, -- JSON 格式儲存主色選項
    sub_colors TEXT, -- JSON 格式儲存副色選項
    image_path VARCHAR(500), -- 商品圖片路徑
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 端點

### 商品管理
- `GET /api/products` - 取得所有商品
- `GET /api/products/:id` - 取得單一商品
- `POST /api/products` - 新增商品（支援圖片上傳）
- `PUT /api/products/:id` - 更新商品（支援圖片上傳）
- `DELETE /api/products/:id` - 刪除商品
- `PATCH /api/products/:id/stock` - 更新商品庫存

### 配置同步
- `GET /api/products/config/generate` - 生成前端配置
- `POST /api/products/config/update` - 更新前端配置檔案

## 檔案結構

```
images/
  products/          # 商品圖片儲存目錄
    image-123.jpg
    image-456.png

js/
  shopping.js        # 前端商品配置檔案（自動生成）

backend/
  routes/
    products.js      # 商品管理 API
  database.sqlite    # SQLite 資料庫
```

## 注意事項

1. **圖片上傳**: 只支援圖片格式，檔案大小限制 5MB
2. **商品ID**: 必須是唯一值，建議使用有意義的識別碼
3. **顏色配置**: 使用 JSON 格式，例如 `["black", "white"]`
4. **前端同步**: 更新配置後需要重新整理前端頁面
5. **資料備份**: 建議定期備份資料庫檔案

## 錯誤處理

- 圖片格式不支援會顯示錯誤訊息
- 檔案大小超限會拒絕上傳
- 商品ID重複會提示錯誤
- 網路錯誤會顯示友善的錯誤訊息

## 未來擴展

- [ ] 商品分類管理
- [ ] 批量操作功能
- [ ] 商品排序功能
- [ ] 圖片裁剪功能
- [ ] 商品預覽功能
- [ ] 匯入/匯出功能 