# Railway PostgreSQL 設置指南

## 問題說明

Railway 的 `railway.json` 配置檔案無法自動創建 PostgreSQL 服務，需要手動在 Railway 控制台中設置。

## 解決方案

### 1. 在 Railway 控制台中添加 PostgreSQL 服務

1. **登入 Railway 控制台**

   - 前往 [railway.app](https://railway.app)
   - 登入你的帳號

2. **選擇你的專案**

   - 找到你的 `2025-SOFT` 專案

3. **添加 PostgreSQL 服務**

   - 點擊 "New Service"
   - 選擇 "Database" → "PostgreSQL"
   - Railway 會自動創建一個 PostgreSQL 實例

4. **連接服務**
   - Railway 會自動設置 `DATABASE_URL` 環境變數
   - 你的應用程式會自動連接到這個 PostgreSQL 實例

### 2. 驗證設置

部署後，你應該會看到類似這樣的日誌：

```
🔍 資料庫配置檢查:
  - DATABASE_URL: 已設置
  - NODE_ENV: staging
  - 使用 PostgreSQL: true
📦 載入 PostgreSQL 模組...
✅ PostgreSQL 連接池已初始化
✅ PostgreSQL 連接測試成功
✅ PostgreSQL 資料庫表格初始化完成
```

### 3. 備用方案

如果 PostgreSQL 服務無法連接，應用程式會自動回退到 SQLite：

```
⚠️  PostgreSQL 環境變數未設置，回退到 SQLite
📦 載入 SQLite 模組...
✅ 成功連接到 SQLite 資料庫
```

## 部署步驟

1. **提交變更**：

   ```bash
   git add .
   git commit -m "Add PostgreSQL fallback mechanism for Railway deployment"
   git push origin staging
   ```

2. **在 Railway 控制台中**：

   - 添加 PostgreSQL 服務
   - 重新部署應用程式

3. **驗證部署**：
   - 檢查應用程式日誌
   - 確認資料庫連接成功

## 注意事項

- Railway 的 PostgreSQL 服務是付費功能
- 如果不想使用 PostgreSQL，應用程式會自動使用 SQLite
- 確保在 Railway 控制台中正確設置了環境變數
