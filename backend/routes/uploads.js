const express = require("express");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const router = express.Router();

const requiredEnv = ["S3_BUCKET", "S3_REGION"];
requiredEnv.forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️ 缺少環境變數 ${k}，請於部署環境設定`);
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
  try {
    const {
      fileName,
      contentType,
      folder = "images/products",
    } = req.body || {};
    if (!fileName || !contentType) {
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

module.exports = router;
