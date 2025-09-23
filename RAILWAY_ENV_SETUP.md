# Railway 環境變數設置指南

## 問題診斷

從你的日誌可以看出：

- PostgreSQL 服務已成功啟動 ✅
- 但 `DATABASE_URL` 環境變數未設置 ❌
- 應用程式回退到 SQLite，但 SQLite 檔案路徑無法創建 ❌

## 解決方案

### 方法一：手動設置 DATABASE_URL

1. **在 Railway 控制台中**：

   - 點擊你的 `2025-SOFT` 應用程式服務（不是 PostgreSQL 服務）
   - 前往 "Variables" 標籤
   - 點擊 "New Variable"

2. **添加環境變數**：

   - **名稱**: `DATABASE_URL`
   - **值**: 從 PostgreSQL 服務複製連接字串

3. **獲取 PostgreSQL 連接字串**：
   - 點擊 PostgreSQL 服務
   - 前往 "Connect" 標籤
   - 複製 "Connection String" 或 "DATABASE_URL"
   - 格式類似：`postgresql://postgres:password@host:port/database`

### 方法二：檢查 Railway 自動設置的環境變數

Railway 可能使用不同的環境變數名稱。更新後的程式碼會檢查：

- `DATABASE_URL`
- `POSTGRES_URL`
- `PGDATABASE`
- `RAILWAY_DATABASE_URL`

### 方法三：使用 Railway CLI

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 設置環境變數
railway variables set DATABASE_URL="your-postgres-connection-string"
```

## 驗證設置

部署後，你應該會看到：

```
🔍 資料庫配置檢查:
  - DATABASE_URL: 已設置
  - POSTGRES_URL: 未設置
  - PGDATABASE: 未設置
  - RAILWAY_DATABASE_URL: 未設置
  - NODE_ENV: staging
  - RAILWAY_ENVIRONMENT: staging
  - 使用 PostgreSQL: true
📦 載入 PostgreSQL 模組...
✅ PostgreSQL 連接池已初始化
✅ PostgreSQL 連接測試成功
✅ PostgreSQL 資料庫表格初始化完成
```

## 故障排除

### 如果仍然失敗：

1. **檢查 Railway 服務連接**：

   - 確保 PostgreSQL 服務和應用程式服務在同一個專案中
   - Railway 會自動設置環境變數

2. **手動設置所有可能的環境變數**：

   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `PGDATABASE`

3. **檢查連接字串格式**：
   - 確保連接字串格式正確
   - 包含主機、端口、用戶名、密碼和資料庫名稱

## 部署步驟

1. **提交變更**：

   ```bash
   git add .
   git commit -m "Add support for multiple PostgreSQL environment variables"
   git push origin staging
   ```

2. **在 Railway 控制台中**：

   - 設置 `DATABASE_URL` 環境變數
   - 重新部署應用程式

3. **檢查日誌**：
   - 確認環境變數已設置
   - 確認 PostgreSQL 連接成功
