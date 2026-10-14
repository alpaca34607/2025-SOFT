# 軟筋生物預購系統 (Soft Bio Pre-order System)

## 📋 專案概述

這是一個完整的電商預購系統，包含前端網站和後端 API。系統支援商品展示、購物車功能、訂單管理和客戶資料管理。

## 🚀 本地端開發模式運行指南

### 前置需求

- **Node.js**: 版本 16.0.0 或以上
- **npm**: 版本 8.0.0 或以上

### 快速啟動

#### 方法 1: 使用啟動腳本 (推薦)

```bash
# 在專案根目錄執行
.\start.bat
```

啟動腳本會自動：
- 安裝依賴套件
- 啟動後端伺服器
- 開啟管理後台
- 顯示可用的 URL

#### 方法 2: 手動啟動

```bash
# 1. 進入後端目錄
cd backend

# 2. 安裝依賴套件
npm install

# 3. 確認資料庫環境變數
# 將 TiDB 連線字串設定在 backend/.env 的 DATABASE_URL

# 4. 開發模式啟動（支援 nodemon）
npm run dev

# 正式模式可改用
# npm start
```

### 🌐 可用的頁面

啟動後，您可以在瀏覽器中訪問以下頁面：

#### 主要頁面
- **🏠 網站首頁**: http://localhost:3000/index.html
- **🛒 商店頁面**: http://localhost:3000/Get-Soft.html
- **📋 管理後台**: http://localhost:3000/admin.html
- **💳 結帳頁面**: http://localhost:3000/checkout.html

#### 商品頁面
- **戶外風軟吉拉**: http://localhost:3000/product-SoftzillaOD.html
- **軟吉拉公仔**: http://localhost:3000/product-Softzilla.html
- **小貓仔黏土偶**: http://localhost:3000/product-Softtwice.html
- **軟筋臥佛公仔**: http://localhost:3000/product-Soft.html
- **餘量釋出**: http://localhost:3000/product-Remain.html

#### 測試頁面
- **API 健康檢查**: http://localhost:3000/test-health.html
- **API 功能測試**: http://localhost:3000/test-api.html

### 🔧 系統狀態檢查

#### API 健康檢查
```bash
# 檢查 API 是否正常運行
curl http://localhost:3000/api/health
```

預期回應：
```json
{
  "status": "success",
  "message": "軟筋生物預購系統 API 運行中",
  "timestamp": "2025-08-02T20:12:48.519Z",
  "environment": "development"
}
```

#### 資料庫狀態
- **資料庫類型**: TiDB（MySQL 相容協定）
- **資料庫存取**: Prisma Client
- **初始化**: 使用 `prisma db push` 或正式 Prisma migration
- **必要環境變數**: `DATABASE_URL`

### 🗄️ Prisma + TiDB

目前分支只使用 Prisma + TiDB，不再提供 SQLite 或 PostgreSQL runtime
fallback。Prisma schema 位於 `backend/prisma/schema.prisma`，使用
`provider = "mysql"` 以相容 TiDB。

```powershell
cd backend
npm install
$env:DATABASE_URL = "mysql://使用者:密碼@主機:4000/資料庫名稱"
npm run prisma:generate
npm run prisma:validate
npm run prisma:db-push
```

`prisma:db-push` 適合建立新的 TiDB 資料庫；它不會自動搬遷舊資料。
本分支預期由使用者手動補回舊資料。`database_schema.sql` 與
`database_postgres_schema.sql` 僅保留作為歷史 schema 參考，不會在應用程式
啟動時讀取。

### 📁 專案結構

```
SOFT/
├── backend/                 # 後端 API 伺服器
│   ├── server.js           # 主伺服器檔案
│   ├── database-prisma.js  # Prisma/TiDB 查詢介面
│   ├── prisma/             # TiDB Prisma schema
│   ├── routes/             # API 路由
│   │   ├── orders.js       # 訂單管理
│   │   ├── products.js     # 商品管理
│   │   └── customers.js    # 客戶管理
│   └── package.json        # 後端依賴
├── js/                     # 前端 JavaScript
│   ├── api.js             # API 整合模組
│   ├── shopping.js        # 購物功能
│   ├── checkout.js        # 結帳功能
│   └── shop-menu.js       # 商店選單
├── css/                    # 樣式檔案
├── images/                 # 圖片資源
├── index.html              # 首頁
├── Get-Soft.html          # 商店頁面
├── admin.html             # 管理後台
├── checkout.html          # 結帳頁面
└── start.bat              # 快速啟動腳本
```

### 🔍 故障排除

#### 常見問題

1. **伺服器無法啟動**
   ```bash
   # 檢查 Node.js 版本
   node --version
   
   # 檢查依賴是否安裝
   cd backend
   npm install
   ```

2. **API 連接失敗**
   - 確認 `DATABASE_URL` 是 TiDB 的 MySQL 連線字串
   - 先在 `backend` 目錄執行 `npm run prisma:validate`
   ```bash
   # 檢查伺服器是否運行
   Get-Process -Name "node"
   
   # 重新啟動伺服器
   taskkill /F /IM node.exe
   cd backend
   node server.js
   ```

3. **靜態檔案無法載入**
   - 確認伺服器配置中的靜態檔案路徑正確
   - 檢查檔案是否存在於正確位置

#### 開發模式特點

- **熱重載**: 修改程式碼後需要重新啟動伺服器
- **CORS**: 已配置跨域請求支援
- **靜態檔案**: 自動提供 HTML、CSS、JS 檔案服務
- **API 端點**: 所有 API 端點以 `/api/` 開頭

### 🛠️ 開發工具

#### 推薦的開發環境
- **編輯器**: Visual Studio Code
- **瀏覽器**: Chrome (開發者工具)
- **終端機**: PowerShell 或 Command Prompt

#### 有用的開發命令

```bash
# 檢查伺服器狀態
Get-Process -Name "node"

# 終止所有 Node.js 進程
taskkill /F /IM node.exe

# 檢查端口使用情況
netstat -ano | findstr :3000

# 重新啟動伺服器
cd backend
node server.js
```

### 📝 注意事項

1. **開發模式**: 目前運行在開發模式 (`NODE_ENV=development`)
2. **資料庫**: 使用 TiDB，連線資訊由 `DATABASE_URL` 提供
3. **API 端點**: 所有 API 端點都有健康檢查機制
4. **錯誤處理**: 前端有 fallback 機制，API 失敗時會使用 localStorage

### 🚀 下一步

完成本地端測試後，可以參考 `DEPLOYMENT.md` 進行生產環境部署。

---

**版本**: 1.0.0  
**最後更新**: 2025-08-02  
**維護者**: Soft Bio Team

#qr 假code生成器
start create-qrcode-placeholders.html