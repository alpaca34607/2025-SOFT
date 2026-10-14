# 軟筋生物預購系統 - 後端 API

## 概述

後端提供商品、客戶、訂單、banner 設定與圖片上傳 API。資料庫 runtime
固定使用 Prisma + TiDB；TiDB 透過 MySQL 相容協定連線。

## 快速開始

### 安裝依賴

```powershell
cd backend
npm install
```

### 設定 TiDB Cloud

以下以 TiDB Cloud 為例。若你使用的是 TiDB Cloud Dedicated，連線流程相同；
差別主要在叢集方案、網路設定與費用。可以先從
[TiDB Cloud Console](https://tidbcloud.com/) 建立一個 Serverless 叢集。

1. 登入 TiDB Cloud，建立 Project 和 Cluster。
2. 選擇離應用程式部署平台較近的 Region。
3. 在 Cluster 的 **Connect** 頁面建立或查看資料庫使用者。
4. 依照 **Connect with MySQL / General connection** 提供的資訊取得：
   `host`、`port`、`user`、`password` 與 `database`。
5. 如果 Console 顯示 IP allowlist，加入目前開發電腦的公網 IP；部署後也要
   加入部署平台的出口 IP。不要為了測試長期開放所有來源。
6. 複製 Console 產生的完整連線字串。TiDB Cloud 通常使用 `4000` port
   並要求 TLS，請保留字串中的 `sslaccept` 或其他 TLS query parameters。

如果連線字串中的 database 尚未存在，可以在 TiDB Cloud SQL Editor 執行：

```sql
CREATE DATABASE IF NOT EXISTS soft_bio;
```

TiDB Cloud 的連線方式可參考官方文件：
[Connect to Your TiDB Cloud Dedicated Cluster](https://docs.pingcap.com/tidbcloud/connect-to-tidb-cluster/)。

### 在 Windows 設定本機環境變數

請在 `backend` 目錄建立 `.env`（檔案不會被提交到 Git），或只在目前
PowerShell 工作階段設定環境變數：

```powershell
cd backend
$env:DATABASE_URL = "mysql://使用者:密碼@主機:4000/資料庫名稱?sslaccept=strict"
```

如果密碼包含 `@`、`#`、`?`、`/` 或 `%` 等 URL 保留字元，必須先做
URL encoding。例如密碼 `p@ss#word` 不可以直接放進 URL；請改成
`p%40ss%23word`。不要把包含密碼的 `DATABASE_URL` 貼到聊天、Issue 或
提交到 Git。

你也可以建立 `backend/.env`：

```dotenv
DATABASE_URL="mysql://使用者:密碼@主機:4000/資料庫名稱?sslaccept=strict"
```

### 建立 TiDB schema

第一次使用新的 TiDB 資料庫時，在 `backend` 目錄執行：

```powershell
npm run prisma:generate
npm run prisma:validate
npm run prisma:db-push
```

`prisma:db-push` 會依照 `prisma/schema.prisma` 建立或更新
`products`、`customers`、`orders` 與 `site_config`。請確認
`DATABASE_URL` 指向正確的 TiDB database，再執行這個命令。

`DATABASE_URL` 是必要設定。應用程式不會在啟動時自動修改 schema；請在
部署前執行 `prisma:db-push`，或使用已建立的 Prisma migration 執行
`npm run prisma:migrate-deploy`。

`prisma/schema.prisma` 是目前唯一的正式資料庫 schema，對應
`products`、`customers`、`orders` 與 `site_config`。根目錄的
`database_schema.sql` 和 `database_postgres_schema.sql` 僅保留作為歷史參考，
不會被應用程式讀取。

### 啟動伺服器

```powershell
npm run dev
# 或
npm start
```

確認 HTTP API：

```text
GET http://localhost:3000/api/health
```

確認 API 到 TiDB 的連線：

```text
GET http://localhost:3000/api/products/debug/health
```

`/api/health` 只確認 HTTP server；`/api/products/debug/health` 才會執行
資料庫查詢。

## API 端點

### 訂單

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/search/phone/:phone`

### 商品

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `PATCH /api/products/:id/stock`

### 客戶

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/customers/search/phone/:phone`

### 其他

- `GET /api/banner`
- `PUT /api/banner`
- `GET /api/banner/product-side`
- `PUT /api/banner/product-side`
- `POST /api/uploads/presign`
- `POST /api/uploads/delete`

管理後台的商品圖片欄位支援直接貼上 `http`/`https` 圖片網址；LightSlider
可每行貼上一個網址。網址會直接儲存到商品資料，不會由後端下載或代理，
因此外部圖片必須允許公開讀取。

## 專案結構

```text
backend/
├── server.js
├── database-adapter.js
├── database-prisma.js
├── prisma/
│   └── schema.prisma
├── prisma-client.js
├── prisma.config.js
├── routes/
└── package.json
```

## 部署環境變數

- `DATABASE_URL`: TiDB MySQL 連線字串，必要
- `NODE_ENV`: `development`、`staging` 或 `production`
- `PORT`: HTTP 服務埠，預設 `3000`
- `PUBLIC_API_URL`: 前端 API URL；未設定時使用本機預設值
- `PUBLIC_SITE_URL`: sitemap 與 robots 使用的公開網站 URL

圖片上傳若使用 S3，另需設定 `S3_BUCKET`、`S3_REGION`、`S3_ACCESS_KEY`
與 `S3_SECRET_KEY` 等對應的 S3 環境變數。

部署到 Vercel、Render 或其他平台時，請在該平台的 Environment Variables
設定 `DATABASE_URL`，不要把 `.env` 上傳或提交。若前端與後端分開部署，
另外設定前端使用的 `PUBLIC_API_URL`。

## 常見問題

### `DATABASE_URL` 未設定

請在啟動 server 或執行 Prisma CLI 前設定 TiDB 連線字串：

```powershell
$env:DATABASE_URL = "mysql://使用者:密碼@主機:4000/資料庫名稱"
```

### Schema 尚未建立

在 `backend` 目錄執行：

```powershell
npm run prisma:validate
npm run prisma:db-push
```

舊資料不會自動搬遷；本分支預期由使用者手動補回。

### 常見連線錯誤

- **P1001 / can't reach database server**：檢查 host、port、IP allowlist
  與部署平台網路；TiDB Cloud 通常使用 port `4000`。
- **P1000 / authentication failed**：重新從 Console 複製使用者、密碼與
  連線字串，並確認密碼中的特殊字元已 URL encoding。
- **TLS 或 certificate error**：使用 TiDB Cloud Console 產生的完整連線
  字串，不要自行刪除 `sslaccept` 或 TLS 參數。
- **Unknown database**：先在 Console 或 SQL Editor 建立 database，或把
  `DATABASE_URL` 最後的 database 名稱改成已存在的 database。
