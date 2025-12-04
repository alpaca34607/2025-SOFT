const path = require("path");

// 載入環境變數
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const fs = require("fs");

// 使用資料庫適配器
const { setupDatabase } = require("./database-adapter");

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(
  cors({
    origin: true, // 允許所有來源
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// 移除全域 body parser，讓各路由自己處理
// 這樣可以避免與 multer 的 multipart/form-data 衝突

// 靜態檔案服務 (開發和生產環境都啟用)
app.use(express.static(path.join(__dirname, "../")));

// 健康檢查端點 (必須在其他 API 路由之前)
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "軟筋生物預購系統 API 運行中",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 環境配置端點
app.get("/api/config", (req, res) => {
  console.log("🔍 環境變數檢查:");
  console.log("  - PUBLIC_API_URL:", process.env.PUBLIC_API_URL);
  console.log("  - API_BASE_URL:", process.env.API_BASE_URL);
  console.log("  - NODE_ENV:", process.env.NODE_ENV);

  res.json({
    API_BASE_URL:
      process.env.PUBLIC_API_URL ||
      process.env.API_BASE_URL ||
      "http://localhost:3000",
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 3000,
    ENABLE_DEBUG: process.env.ENABLE_DEBUG || "false",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
  });
});

// API 路由
const ordersRouter = require("./routes/orders");
const productsRouter = require("./routes/products");
const customersRouter = require("./routes/customers");
console.log("🔧 載入 uploads 路由...");
const uploadsRouter = require("./routes/uploads");
console.log("✅ uploads 路由載入完成");
console.log("🔧 載入 banner 路由...");
const bannerRouter = require("./routes/banner");
console.log("✅ banner 路由載入完成");

app.use("/api/orders", ordersRouter);
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/banner", bannerRouter);

// 調試：記錄所有 API 路由
console.log("📋 已註冊的 API 路由:");
console.log("  - GET    /api/health");
console.log("  - POST   /api/orders");
console.log("  - GET    /api/orders");
console.log("  - GET    /api/orders/:id");
console.log("  - DELETE /api/orders/:id");
console.log("  - DELETE /api/orders/batch/all");
console.log("  - PATCH  /api/orders/:id/status");
console.log("  - GET    /api/orders/search/phone/:phone");
console.log("  - GET    /api/products");
console.log("  - GET    /api/products/:id");
console.log("  - POST   /api/products");
console.log("  - PUT    /api/products/:id");
console.log("  - DELETE /api/products/:id");
console.log("  - PATCH  /api/products/:id/stock");
console.log("  - GET    /api/customers");
console.log("  - POST   /api/customers");
console.log("  - PUT    /api/customers/:id");
console.log("  - DELETE /api/customers/:id");
console.log("  - GET    /api/uploads/test");
console.log("  - GET    /api/uploads/presign (測試用)");
console.log("  - POST   /api/uploads/presign");
console.log("  - POST   /api/uploads/delete");
console.log("  - GET    /api/banner");
console.log("  - PUT    /api/banner");
console.log("  - GET    /api/banner/product-side");
console.log("  - PUT    /api/banner/product-side");

function loadStaticFile(possiblePaths, fallbackContent, type) {
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
      }
    } catch (error) {
      console.warn(`⚠️ 無法讀取 ${type} 檔案：${filePath}`, error.message);
    }
  }
  console.warn(`⚠️ 找不到 ${type} 檔案，改用預設內容`);
  return fallbackContent;
}

const sitemapContent = loadStaticFile(
  [
    path.join(__dirname, "../sitemap.xml"),
    path.join(__dirname, "sitemap.xml"),
    path.join(process.cwd(), "sitemap.xml"),
  ],
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soft-creature.up.railway.app/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soft-creature.up.railway.app/Learning-Soft.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soft-creature.up.railway.app/Becoming-Soft.html</loc>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://soft-creature.up.railway.app/Get-Soft.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soft-creature.up.railway.app/WhatsNew.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://soft-creature.up.railway.app/product.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`,
  "sitemap.xml"
);

const robotsContent = loadStaticFile(
  [
    path.join(__dirname, "../robots.txt"),
    path.join(__dirname, "robots.txt"),
    path.join(process.cwd(), "robots.txt"),
  ],
  `User-agent: *
Disallow: /admin.html
Disallow: /admin-login.html
Disallow: /checkout.html

Sitemap: https://soft-creature.up.railway.app/sitemap.xml
`,
  "robots.txt"
);

// Sitemap 與 robots 專用路由（避免被 SPA fallback 攔截）
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.send(sitemapContent);
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(robotsContent);
});

// 生產環境：所有非 API 路由都返回前端頁面
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    // 如果是 API 路由，不處理
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    // 根據路徑返回對應的 HTML 檔案
    let htmlFile = "index.html";

    // 映射路由到 HTML 檔案
    const routeMap = {
      "/checkout": "checkout.html",
      "/admin": "admin.html",
      "/Get-Soft": "Get-Soft.html",
      "/product-SoftzillaOD": "product-SoftzillaOD.html",
      "/product-Softzilla": "product-Softzilla.html",
      "/product-Softtwice": "product-Softtwice.html",
      "/product-Soft": "product-Soft.html",
      "/product-Remain": "product-Remain.html",
      "/WhatsNew": "WhatsNew.html",
      "/Learning-Soft": "Learning-Soft.html",
      "/Becoming-Soft": "Becoming-Soft.html",
    };

    if (routeMap[req.path]) {
      htmlFile = routeMap[req.path];
    }

    res.sendFile(path.join(__dirname, "../", htmlFile));
  });
}

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error("❌ 伺服器錯誤:", err);
  console.error("請求路徑:", req.path);
  console.error("請求方法:", req.method);
  res.status(500).json({
    error: "內部伺服器錯誤",
    message:
      process.env.NODE_ENV === "development" ? err.message : "請稍後再試",
  });
});

// 404 處理
app.use((req, res) => {
  console.log("404 錯誤 - 路徑:", req.path, "方法:", req.method);
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    res.status(404).sendFile(path.join(__dirname, "../", "index.html"));
  }
});

// 初始化資料庫 (用於 Vercel serverless 環境)
async function initializeDatabase() {
  try {
    await setupDatabase();
    console.log("✅ 成功連接到資料庫");
    console.log("🔄 初始化資料庫...");
    console.log("✅ 資料庫表格初始化完成");
  } catch (error) {
    console.error("❌ 資料庫初始化失敗:", error);
    throw error;
  }
}

// 資料庫初始化狀態
let databaseInitialized = false;

// 確保資料庫已初始化的中間件
async function ensureDatabaseInitialized(req, res, next) {
  if (!databaseInitialized) {
    try {
      await initializeDatabase();
      databaseInitialized = true;
      console.log("✅ 資料庫初始化完成 (serverless)");
    } catch (error) {
      console.error("❌ 資料庫初始化失敗:", error);
      return res.status(500).json({
        error: "伺服器初始化失敗",
        message: error.message,
      });
    }
  }
  next();
}

// 在所有 API 路由前添加資料庫初始化中間件
app.use("/api", ensureDatabaseInitialized);

// 根據環境決定啟動方式
if (require.main === module) {
  // 所有環境都啟動伺服器
  async function startServer() {
    try {
      await initializeDatabase();
      databaseInitialized = true;

      // Railway 要求：必須綁定到 0.0.0.0 和使用 PORT 環境變數
      // 根據 Railway 官方文檔：https://docs.railway.com/reference/errors/application-failed-to-respond
      // 本地開發：使用 localhost 以便於開發
      const host =
        process.env.NODE_ENV === "staging" ||
        process.env.NODE_ENV === "production"
          ? "0.0.0.0" // Railway/生產環境
          : "localhost"; // 本地開發環境

      app.listen(PORT, host, () => {
        console.log(`🚀 伺服器運行在 http://${host}:${PORT}`);
        console.log(`📊 API 文檔: http://${host}:${PORT}/api/health`);
        console.log(`🌍 環境: ${process.env.NODE_ENV || "development"}`);
        console.log(`🏠 網站首頁: http://${host}:${PORT}/index.html`);
        console.log(`🛒 商店頁面: http://${host}:${PORT}/Get-Soft.html`);
        console.log(`📋 管理後台: http://${host}:${PORT}/admin.html`);
      });
    } catch (error) {
      console.error("❌ 伺服器啟動失敗:", error);
      process.exit(1);
    }
  }

  startServer();
}

module.exports = app;
