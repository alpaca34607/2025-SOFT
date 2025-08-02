# 軟筋生物預購系統 - 部署指南

## 部署選項

### 方案 1: Vercel (推薦 - 免費且簡單)

#### 步驟 1: 準備 GitHub 倉庫
1. 將專案推送到 GitHub
2. 確保所有檔案都在根目錄

#### 步驟 2: 部署到 Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇您的 GitHub 倉庫
5. 設定：
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `cd backend && npm install`
   - Output Directory: `./`
   - Install Command: `cd backend && npm install`
6. 點擊 "Deploy"

#### 步驟 3: 設定環境變數
在 Vercel 專案設定中：
- `NODE_ENV`: `production`

### 方案 2: Railway (全棧部署)

#### 步驟 1: 部署到 Railway
1. 前往 [railway.app](https://railway.app)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇您的倉庫
5. Railway 會自動檢測並部署

#### 步驟 2: 設定環境變數
在 Railway 專案設定中：
- `NODE_ENV`: `production`
- `PORT`: `3000`

### 方案 3: Render (經濟實惠)

#### 步驟 1: 部署到 Render
1. 前往 [render.com](https://render.com)
2. 註冊帳號
3. 點擊 "New" → "Web Service"
4. 連接 GitHub 倉庫
5. 設定：
   - Name: `soft-bio-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
6. 點擊 "Create Web Service"

#### 步驟 2: 設定環境變數
在 Render 專案設定中：
- `NODE_ENV`: `production`

## 資料庫選擇

### 選項 1: 繼續使用 SQLite (簡單)
- 優點：無需額外設定
- 缺點：資料可能遺失，不適合高流量

### 選項 2: 升級到 PostgreSQL (推薦)
- 優點：穩定、可擴展
- 缺點：需要額外設定

#### PostgreSQL 設定步驟：

1. **Railway PostgreSQL**:
   - 在 Railway 中創建 PostgreSQL 資料庫
   - 複製連接字串
   - 設定環境變數 `DATABASE_URL`

2. **Render PostgreSQL**:
   - 在 Render 中創建 PostgreSQL 資料庫
   - 複製連接字串
   - 設定環境變數 `DATABASE_URL`

3. **修改資料庫配置**:
   ```javascript
   // 在 backend/database.js 中
   const databaseUrl = process.env.DATABASE_URL || 'sqlite:database.sqlite';
   ```

## 域名設定

### 自訂域名
1. 在部署平台購買域名或使用現有域名
2. 在平台設定中添加自訂域名
3. 設定 DNS 記錄指向平台提供的 IP

### SSL 憑證
- Vercel: 自動提供
- Railway: 自動提供
- Render: 自動提供

## 監控和維護

### 健康檢查
- 端點: `/api/health`
- 定期檢查網站狀態

### 備份策略
- 定期備份資料庫
- 使用版本控制管理程式碼

### 更新部署
- 推送程式碼到 GitHub
- 平台會自動重新部署

## 故障排除

### 常見問題

1. **API 連接失敗**
   - 檢查環境變數設定
   - 確認 API 端點正確

2. **資料庫連接失敗**
   - 檢查資料庫連接字串
   - 確認資料庫服務運行中

3. **靜態檔案無法載入**
   - 檢查檔案路徑
   - 確認檔案存在於正確位置

### 聯絡支援
- Vercel: [support.vercel.com](https://support.vercel.com)
- Railway: [railway.app/support](https://railway.app/support)
- Render: [render.com/support](https://render.com/support)

## 成本估算

### Vercel
- 免費方案：每月 100GB 頻寬
- 付費方案：$20/月起

### Railway
- 免費方案：每月 $5 額度
- 付費方案：按使用量計費

### Render
- 免費方案：每月 750 小時
- 付費方案：$7/月起

## 推薦部署流程

1. **開發階段**：使用 Vercel（免費且簡單）
2. **成長階段**：考慮 Railway 或 Render
3. **成熟階段**：考慮自建伺服器或雲端服務

## 安全注意事項

1. **環境變數**：不要將敏感資訊提交到程式碼
2. **API 金鑰**：使用環境變數管理
3. **資料庫密碼**：定期更換
4. **HTTPS**：確保所有流量使用 HTTPS
5. **備份**：定期備份重要資料 