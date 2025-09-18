# Railway PostgreSQL 遷移指南

## 🚀 步驟 1：在 Railway 添加 PostgreSQL 服務

### 1.1 登入 Railway Dashboard

- 訪問 [Railway Dashboard](https://railway.app)
- 選擇你的專案 "2025-SOFT"

### 1.2 添加 PostgreSQL 服務

1. 點擊 **"+ New"** 按鈕
2. 選擇 **"Database"** → **"PostgreSQL"**
3. Railway 會自動創建 PostgreSQL 實例
4. 等待服務啟動完成

### 1.3 獲取連接資訊

1. 在 PostgreSQL 服務頁面，點擊 **"Variables"** 標籤
2. 複製 `DATABASE_URL` 的值（格式類似：`postgresql://username:password@host:port/database`）

## 🔧 步驟 2：配置環境變數

### 2.1 在 Railway Dashboard 設定環境變數

1. 回到你的主應用程式服務
2. 進入 **"Variables"** 頁面
3. 添加以下環境變數：
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```
   （使用步驟 1.3 中複製的值）

### 2.2 驗證環境變數

確保以下環境變數已設定：

- ✅ `DATABASE_URL` - PostgreSQL 連接字串
- ✅ `NODE_ENV` - staging
- ✅ `PUBLIC_API_URL` - https://2025-soft-staging.up.railway.app

## 📦 步驟 3：初始化 PostgreSQL 資料庫

### 3.1 本地初始化（推薦）

```bash
# 設定環境變數（使用 Railway 的 DATABASE_URL）
export DATABASE_URL="postgresql://username:password@host:port/database"

# 初始化 PostgreSQL 資料庫
cd backend
node init-postgres.js
```

### 3.2 或直接在 Railway 執行

1. 在 Railway Dashboard 中，進入你的應用程式服務
2. 點擊 **"Deployments"** 標籤
3. 找到最新的部署，點擊 **"View Logs"**
4. 在部署過程中，PostgreSQL 會自動初始化

## 🔄 步驟 4：遷移資料

### 4.1 執行遷移腳本

```bash
# 確保環境變數已設定
export DATABASE_URL="postgresql://username:password@host:port/database"

# 執行遷移
cd backend
node migrate-to-postgres.js
```

### 4.2 驗證遷移結果

遷移完成後，你應該會看到：

```
🔄 開始從 SQLite 遷移到 PostgreSQL...
✅ PostgreSQL 連接成功
📦 遷移產品資料...
✅ 已遷移 X 個產品
📋 遷移訂單資料...
✅ 已遷移 X 個訂單
👥 遷移客戶資料...
✅ 已遷移 X 個客戶
🎉 遷移完成！
```

## 🚀 步驟 5：重新部署

### 5.1 提交更改

```bash
git add .
git commit -m "Add PostgreSQL support and migration scripts"
git push
```

### 5.2 Railway 自動部署

- Railway 會自動檢測到代碼變更
- 開始重新部署應用程式
- 等待部署完成

## ✅ 步驟 6：驗證部署

### 6.1 檢查部署日誌

在 Railway Dashboard 中查看部署日誌，應該會看到：

```
🔍 資料庫配置檢查:
  - DATABASE_URL: 已設置
  - NODE_ENV: staging
  - 使用 PostgreSQL: true
📦 載入 PostgreSQL 模組...
✅ PostgreSQL 連接池已初始化
```

### 6.2 測試 API

訪問以下 URL 測試：

- `https://2025-soft-staging.up.railway.app/api/health`
- `https://2025-soft-staging.up.railway.app/api/products`

### 6.3 測試前端

訪問 Vercel 網站：

- `https://soft-gray.vercel.app/product-SoftzillaOD.html`

## 🎯 完成！

遷移完成後，你的應用程式將：

- ✅ 使用 PostgreSQL 作為生產資料庫
- ✅ 支援高並發讀寫
- ✅ 不會因重新部署而重置資料
- ✅ 支援外部使用者存取
- ✅ 自動備份和恢復

## 🆘 故障排除

### 問題 1：PostgreSQL 連接失敗

**解決方案**：

- 檢查 `DATABASE_URL` 是否正確設定
- 確認 PostgreSQL 服務已啟動
- 檢查網路連接

### 問題 2：遷移腳本失敗

**解決方案**：

- 確保 SQLite 資料庫檔案存在
- 檢查 PostgreSQL 權限
- 查看詳細錯誤訊息

### 問題 3：應用程式無法啟動

**解決方案**：

- 檢查環境變數設定
- 查看部署日誌
- 確認資料庫連接

## 📞 需要幫助？

如果遇到問題，請：

1. 檢查 Railway Dashboard 的部署日誌
2. 確認所有環境變數已正確設定
3. 驗證 PostgreSQL 服務狀態
