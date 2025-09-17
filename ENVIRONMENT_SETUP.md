# 環境變數設置說明

## 如何設置本地環境變數

### 1. 創建 .env 文件

在專案根目錄創建 `.env` 文件，內容如下：

```bash
# 環境變數配置
# 手動切換環境：註解不使用的環境，取消註解要使用的環境

# ===========================================
# 本地開發環境 (預設)
# ===========================================
PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
PORT=3000

# ===========================================
# Railway 測試環境
# ===========================================
# PUBLIC_API_URL=https://2025-soft-staging.up.railway.app
# NODE_ENV=staging
# PORT=3000

# ===========================================
# Railway 正式環境 (如果有的話)
# ===========================================
# PUBLIC_API_URL=https://your-production-domain.up.railway.app
# NODE_ENV=production
# PORT=3000

# ===========================================
# 其他環境變數
# ===========================================
# ENABLE_DEBUG=true
# LOG_LEVEL=debug
```

### 2. 如何切換環境

要切換到 Railway 測試環境：

1. 註解掉本地環境的變數（在行首加上 `#`）
2. 取消註解 Railway 測試環境的變數（移除行首的 `#`）

例如，要使用 Railway 測試環境：

```bash
# 本地環境 - 註解掉
# PUBLIC_API_URL=http://localhost:3000
# NODE_ENV=development
# PORT=3000

# Railway 測試環境 - 取消註解
PUBLIC_API_URL=https://2025-soft-staging.up.railway.app
NODE_ENV=staging
PORT=3000
```

### 3. 如何找到您的 Railway API URL

根據您提供的 Railway 設置截圖，您可以通過以下方式找到 API URL：

#### 方法 1: 從 Railway 控制台

1. 登入 Railway 控制台
2. 選擇您的專案 "2025-SOFT"
3. 在 Settings 頁面中，找到 "Networking" 區塊
4. 在 "Public Networking" 中，點擊 "Generate Domain" 生成公共網域
5. 生成的網域格式類似：`https://your-project-name.up.railway.app`

#### 方法 2: 從部署頁面

1. 在 Railway 控制台中，點擊 "Deployments" 標籤
2. 查看最新的部署記錄
3. 在部署詳情中會顯示生成的網域

#### 方法 3: 從環境變數

1. 在 Railway 控制台中，點擊 "Variables" 標籤
2. 查看是否有 `RAILWAY_PUBLIC_DOMAIN` 或類似的環境變數

#### 重要提醒

- 確保您的 Railway 服務已啟用 "Public Networking"
- 生成的網域會自動包含 HTTPS
- 您的 Railway staging 網域：`https://2025-soft-staging.up.railway.app`
- 網域格式通常為：`https://[project-name]-[random-string].up.railway.app`

### 4. 後端服務器設置

後端服務器會自動讀取 `.env` 文件中的環境變數。確保：

- `PORT` 變數設置正確
- `NODE_ENV` 設置為對應的環境

### 5. 前端 API 配置

前端的 `js/api.js` 文件已經更新為自動讀取環境變數，無需手動修改。
