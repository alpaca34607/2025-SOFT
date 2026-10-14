# 軟筋生物預購系統 - 後端 API

## 📋 概述

這是軟筋生物預購系統的後端 API 服務，提供完整的電商功能，包括訂單管理、商品管理、客戶管理和資料庫操作。

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### Prisma MySQL/TiDB（可選）

本專案目前預設仍使用既有的 SQLite/PostgreSQL 流程。若要在 TiDB
上使用 Prisma，請明確設定 `DATABASE_PROVIDER=prisma`；未設定時不會切換
現有資料庫。

```powershell
cd backend
npm install
$env:DATABASE_PROVIDER = "prisma"
$env:DATABASE_URL = "mysql://使用者:密碼@主機:4000/資料庫名稱"
npm run prisma:generate
npm run prisma:validate
```

在全新的 TiDB 資料庫建立目前的核心表格：

```powershell
npm run prisma:db-push
```

`prisma:db-push` 只建立 schema，不會將 Railway PostgreSQL 的資料自動轉換
到 MySQL/TiDB。正式搬遷前應先在測試資料庫驗證欄位與資料，再撰寫一次性的
資料搬遷程序。TiDB 使用 MySQL 相容協定，因此 Prisma schema 使用
`provider = "mysql"`。

目前 Prisma schema 位於 `prisma/schema.prisma`，並以 `@map`/`@@map` 對應
現有的 snake_case 表格與欄位。應用程式啟動時只會測試 Prisma 連線，不會
自動執行 `db push` 或修改資料庫。

### 啟動伺服器

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 健康檢查

```bash
curl http://localhost:3000/api/health
```

## 📊 API 端點

### 健康檢查
- **GET** `/api/health` - 系統健康狀態

### 訂單管理
- **POST** `/api/orders` - 建立新訂單
- **GET** `/api/orders` - 取得所有訂單
- **GET** `/api/orders/:id` - 取得特定訂單
- **PUT** `/api/orders/:id/status` - 更新訂單狀態
- **GET** `/api/orders/search/phone/:phone` - 根據電話號碼查詢訂單

### 商品管理
- **GET** `/api/products` - 取得所有商品
- **GET** `/api/products/:id` - 取得特定商品
- **POST** `/api/products` - 新增商品
- **PUT** `/api/products/:id` - 更新商品
- **DELETE** `/api/products/:id` - 刪除商品
- **PATCH** `/api/products/:id/stock` - 更新商品庫存

### 客戶管理
- **GET** `/api/customers` - 取得所有客戶
- **GET** `/api/customers/:id` - 取得特定客戶
- **POST** `/api/customers` - 新增客戶
- **PUT** `/api/customers/:id` - 更新客戶
- **DELETE** `/api/customers/:id` - 刪除客戶
- **GET** `/api/customers/search/phone/:phone` - 根據電話號碼查詢客戶

## 🗄️ 資料庫結構

### 表格結構

#### customers (客戶表)
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### products (商品表)
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    deposit INTEGER NOT NULL,
    max_quantity INTEGER DEFAULT 3,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### orders (訂單表)
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    deposit_amount INTEGER NOT NULL,
    pickup_method TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);
```

#### order_items (訂單明細表)
```sql
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    main_color TEXT NOT NULL,
    main_color_name TEXT NOT NULL,
    sub_color TEXT NOT NULL,
    sub_color_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    unit_deposit INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    total_deposit INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);
```

## 🔧 開發環境

### 環境變數

- `NODE_ENV`: 環境模式 (`development` | `production`)
- `PORT`: 伺服器端口 (預設: 3000)

### 依賴套件

```json
{
  "express": "^4.18.2",
  "sqlite3": "^5.1.6",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2",
  "uuid": "^9.0.1"
}
```

## 📁 檔案結構

```
backend/
├── server.js              # 主伺服器檔案
├── database.js            # 資料庫連接和初始化
├── database.sqlite        # SQLite 資料庫檔案
├── package.json           # 專案配置
├── routes/                # API 路由
│   ├── orders.js         # 訂單相關 API
│   ├── products.js       # 商品相關 API
│   └── customers.js      # 客戶相關 API
└── README.md             # 本檔案
```

## 🔍 除錯和監控

### 日誌輸出

伺服器啟動時會顯示：
- 資料庫連接狀態
- API 端點資訊
- 可用的頁面 URL

### 常見問題

1. **資料庫連接失敗**
   - 檢查 `database.sqlite` 檔案權限
   - 確認 SQLite3 模組已正確安裝

2. **API 端點無法訪問**
   - 檢查伺服器是否正在運行
   - 確認端口 3000 未被佔用

3. **CORS 錯誤**
   - 確認 CORS 中間件已正確配置
   - 檢查前端請求的 Origin

## 🚀 部署

### 生產環境配置

1. 設定環境變數：
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

2. 啟動伺服器：
   ```bash
   npm start
   ```

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 API 回應格式

### 成功回應
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "error": "錯誤訊息",
  "message": "詳細說明"
}
```

## 🔐 安全性

- 使用 CORS 中間件處理跨域請求
- 輸入驗證和清理
- SQL 注入防護
- 錯誤訊息不暴露敏感資訊

## 📞 支援

如有問題，請檢查：
1. 伺服器日誌輸出
2. API 健康檢查端點
3. 資料庫連接狀態

---

**版本**: 1.0.0  
**最後更新**: 2025-08-02  
**維護者**: Soft Bio Team