const express = require("express");
const { query, run } = require("../database-adapter");

const router = express.Router();

// 获取基础 URL 的函数
function getBaseUrl() {
  return (
    process.env.PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}

// 将相对路径转换为完整 URL 的函数
function convertToFullUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath; // 已经是完整 URL
  if (imagePath.startsWith("data:image/")) return imagePath; // base64 图片

  const baseUrl = getBaseUrl();
  return `${baseUrl}${imagePath}`;
}

// 获取配置的辅助函数
async function getConfig(key, defaultValue) {
  const result = await query(
    `SELECT config_value FROM site_config WHERE config_key = ?`,
    [key]
  );
  if (result.rows && result.rows.length > 0) {
    return result.rows[0].config_value || defaultValue;
  }
  return defaultValue;
}

// 更新配置的辅助函数
async function updateConfig(key, value, description) {
  const checkResult = await query(
    `SELECT id FROM site_config WHERE config_key = ?`,
    [key]
  );

  if (checkResult.rows && checkResult.rows.length > 0) {
    // 更新现有配置
    await run(
      `UPDATE site_config
       SET config_value = ?, updated_at = CURRENT_TIMESTAMP
       WHERE config_key = ?`,
      [value, key]
    );
  } else {
    // 插入新配置
    await run(
      `INSERT INTO site_config (config_key, config_value, description)
       VALUES (?, ?, ?)`,
      [key, value, description]
    );
  }
}

// 获取 banner 图片
router.get("/", async (req, res) => {
  try {
    const bannerImage = await getConfig(
      "banner_image",
      "/images/shop/AD-banner.jpg"
    );

    res.json({
      success: true,
      bannerImage: convertToFullUrl(bannerImage),
      bannerImagePath: bannerImage,
    });
  } catch (error) {
    console.error("获取 banner 图片失败:", error);
    res.status(500).json({
      error: "获取 banner 图片失败",
      message: error.message,
    });
  }
});

// 获取 product-side 配置
router.get("/product-side", async (req, res) => {
  try {
    const productSideLink = await getConfig(
      "product_side_link",
      "./product.html?id=product-Remain"
    );
    const productSideImage = await getConfig(
      "product_side_image",
      "/images/shop/product-side.jpg"
    );
    const productSideAlt = await getConfig(
      "product_side_alt",
      "餘量釋出連結圖片"
    );

    res.json({
      success: true,
      productSideLink: productSideLink,
      productSideImage: convertToFullUrl(productSideImage),
      productSideImagePath: productSideImage,
      productSideAlt: productSideAlt,
    });
  } catch (error) {
    console.error("获取 product-side 配置失败:", error);
    res.status(500).json({
      error: "获取 product-side 配置失败",
      message: error.message,
    });
  }
});

// 更新 banner 图片
router.put("/", express.json(), async (req, res) => {
  try {
    const { bannerImagePath } = req.body;

    if (!bannerImagePath) {
      return res.status(400).json({
        error: "缺少 bannerImagePath 参数",
      });
    }

    await updateConfig(
      "banner_image",
      bannerImagePath,
      "Get-Soft.html 页面的 banner 图片路径"
    );

    res.json({
      success: true,
      message: "Banner 图片更新成功",
      bannerImage: convertToFullUrl(bannerImagePath),
      bannerImagePath: bannerImagePath,
    });
  } catch (error) {
    console.error("更新 banner 图片失败:", error);
    res.status(500).json({
      error: "更新 banner 图片失败",
      message: error.message,
    });
  }
});

// 更新 product-side 配置
router.put("/product-side", express.json(), async (req, res) => {
  try {
    const { productSideLink, productSideImagePath, productSideAlt } = req.body;

    if (!productSideLink || !productSideImagePath) {
      return res.status(400).json({
        error: "缺少必要参数：productSideLink 和 productSideImagePath",
      });
    }

    await updateConfig(
      "product_side_link",
      productSideLink,
      "Get-Soft.html 页面的 product-side 链接"
    );
    await updateConfig(
      "product_side_image",
      productSideImagePath,
      "Get-Soft.html 页面的 product-side 图片路径"
    );
    await updateConfig(
      "product_side_alt",
      productSideAlt || "餘量釋出連結圖片",
      "Get-Soft.html 页面的 product-side 图片 alt 文本"
    );

    res.json({
      success: true,
      message: "Product-side 配置更新成功",
      productSideLink: productSideLink,
      productSideImage: convertToFullUrl(productSideImagePath),
      productSideImagePath: productSideImagePath,
      productSideAlt: productSideAlt || "餘量釋出連結圖片",
    });
  } catch (error) {
    console.error("更新 product-side 配置失败:", error);
    res.status(500).json({
      error: "更新 product-side 配置失败",
      message: error.message,
    });
  }
});

module.exports = router;
