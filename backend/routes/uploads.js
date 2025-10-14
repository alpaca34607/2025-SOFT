const express = require("express");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const router = express.Router();

console.log("🔧 初始化 uploads 路由...");

// 添加测试路由
router.get("/test", (req, res) => {
  console.log("🧪 測試路由被調用");
  res.json({ success: true, message: "uploads 路由正常工作" });
});

// 添加 GET 版本的 presign 路由用于测试
router.get("/presign", (req, res) => {
  console.log("🧪 GET presign 測試路由被調用");
  res.json({
    success: true,
    message: "presign 路由正常工作，但請使用 POST 請求",
    method: "請使用 POST 請求到 /api/uploads/presign",
  });
});

const requiredEnv = ["S3_BUCKET", "S3_REGION"];
requiredEnv.forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️ 缺少環境變數 ${k}，請於部署環境設定`);
  } else {
    console.log(`✅ 環境變數 ${k} 已設置`);
  }
});

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

// 產生預簽名 URL，前端用 PUT 直接上傳到 S3
router.post("/presign", express.json(), async (req, res) => {
  console.log("📤 收到 presign 請求:", req.body);
  try {
    const {
      fileName,
      contentType,
      folder = "images/products",
    } = req.body || {};
    if (!fileName || !contentType) {
      console.log("❌ 缺少必要參數:", { fileName, contentType });
      return res.status(400).json({ error: "缺少 fileName 或 contentType" });
    }

    const ext = (fileName.split(".").pop() || "bin").toLowerCase();
    const key = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const put = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      // 建議用 CloudFront 控制公開讀；若需暫時公開可啟用下行
      // ACL: "public-read",
    });

    const expiresIn = 60 * 3; // 3 分鐘
    const uploadUrl = await getSignedUrl(s3, put, { expiresIn });

    const publicUrl = process.env.S3_PUBLIC_BASE
      ? `${process.env.S3_PUBLIC_BASE}/${key}`
      : `https://${process.env.S3_BUCKET}.s3.${
          process.env.S3_REGION || "us-east-1"
        }.amazonaws.com/${key}`;

    res.json({ success: true, uploadUrl, key, publicUrl, expiresIn });
  } catch (error) {
    console.error("建立預簽名URL失敗:", error);
    res
      .status(500)
      .json({ error: "建立預簽名URL失敗", message: error.message });
  }
});

// 刪除 S3 物件
router.post("/delete", express.json(), async (req, res) => {
  try {
    const { key, url } = req.body || {};
    let objectKey = key;
    if (!objectKey && url) {
      // 將 S3 URL 轉為 key
      try {
        const u = new URL(url);
        objectKey = decodeURIComponent(u.pathname.replace(/^\//, ""));
      } catch (e) {}
    }
    if (!objectKey) {
      return res.status(400).json({ error: "缺少 key 或 url" });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: objectKey,
      })
    );

    res.json({ success: true, key: objectKey });
  } catch (error) {
    console.error("刪除 S3 物件失敗:", error);
    res.status(500).json({ error: "刪除 S3 物件失敗", message: error.message });
  }
});

module.exports = router;
