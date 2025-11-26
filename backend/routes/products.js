const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query, get, run } = require("../database-adapter");

const router = express.Router();

// 獲取基礎URL的函數
function getBaseUrl() {
  return (
    process.env.PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}

// 將相對路徑轉換為完整URL的函數
function convertToFullUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path; // 已經是完整URL

  // 檢查是否為base64數據URL
  if (path.startsWith("data:image/")) return path;

  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}

// 檢查圖片文件是否存在
function checkImageExists(imagePath) {
  if (!imagePath) return false;
  if (imagePath.startsWith("data:image/")) return true; // base64圖片總是存在
  if (imagePath.startsWith("http")) return true; // 外部URL假設存在

  const fullPath = path.join(__dirname, "../..", imagePath);
  return fs.existsSync(fullPath);
}

// 處理產品圖片路徑的函數
function processProductImages(product) {
  if (!product) return product;

  // 處理價格和訂金，將 DECIMAL 值轉換為整數
  if (product.price !== undefined && product.price !== null) {
    // 如果是字串（如 "3800.00"），先轉為數字再轉為整數
    // 如果是數字，直接轉為整數
    product.price = Number.isInteger(product.price)
      ? product.price
      : parseInt(Number(product.price), 10);
  }

  if (product.deposit !== undefined && product.deposit !== null) {
    product.deposit = Number.isInteger(product.deposit)
      ? product.deposit
      : parseInt(Number(product.deposit), 10);
  }

  // 處理各種圖片路徑
  if (product.thumbnail_path) {
    product.thumbnail_path = convertToFullUrl(product.thumbnail_path);
  }

  if (product.sketchfab_background) {
    product.sketchfab_background = convertToFullUrl(
      product.sketchfab_background
    );
  }

  if (product.product_introduction) {
    product.product_introduction = convertToFullUrl(
      product.product_introduction
    );
  }

  if (product.preorder_notes) {
    product.preorder_notes = convertToFullUrl(product.preorder_notes);
  }

  if (product.image_path) {
    product.image_path = convertToFullUrl(product.image_path);
  }

  // 處理 lightsider_images 數組
  if (product.lightslider_images && Array.isArray(product.lightslider_images)) {
    product.lightslider_images = product.lightslider_images.map((img) =>
      convertToFullUrl(img)
    );
  }

  return product;
}

// 設定圖片上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 在部署環境中使用環境變數指定的路徑，否則使用默認路徑
    const uploadDir =
      process.env.UPLOAD_DIR || path.join(__dirname, "../../images/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("只允許上傳圖片檔案"));
    }
  },
});

// 內存存儲（用於base64轉換）
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("只允許上傳圖片檔案"));
    }
  },
});

// 設定多檔案上傳 (用於 LightSlider 圖片)
const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("只允許上傳圖片檔案"));
    }
  },
});

// 上傳圖片並轉換為base64存儲
router.post(
  "/upload-base64",
  uploadMemory.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "沒有上傳圖片" });
      }

      // 轉換為base64
      const base64String = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64String}`;

      res.json({
        success: true,
        message: "圖片上傳成功",
        imageUrl: dataUrl,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error("圖片上傳失敗:", error);
      res.status(500).json({ error: "圖片上傳失敗", message: error.message });
    }
  }
);

// 調試端點 - 數據庫健康檢查
router.get("/debug/health", async (req, res) => {
  try {
    console.log("🔍 執行數據庫健康檢查...");

    // 基本連接測試
    const connectionTest = await query(
      "SELECT NOW() as current_time, version() as postgres_version"
    );

    // 檢查表格
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // 檢查products表格
    const productsCount = await query("SELECT COUNT(*) as count FROM products");

    // 檢查orders表格
    const ordersCount = await query("SELECT COUNT(*) as count FROM orders");

    res.json({
      success: true,
      message: "數據庫健康檢查完成",
      data: {
        connection: connectionTest.rows[0],
        tables: tablesCheck.rows.map((row) => row.table_name),
        productsCount: productsCount.rows[0].count,
        ordersCount: ordersCount.rows[0].count,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ 數據庫健康檢查失敗:", error);
    res.status(500).json({
      success: false,
      error: "數據庫健康檢查失敗",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// 檢查圖片文件是否存在（調試用）
router.get("/debug/check-images/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await get("SELECT * FROM products WHERE product_id = ?", [
      productId,
    ]);

    if (!product) {
      return res.status(404).json({ error: "商品不存在" });
    }

    const imageStatus = {
      thumbnail_path: {
        path: product.thumbnail_path,
        exists: checkImageExists(product.thumbnail_path),
        fullUrl: convertToFullUrl(product.thumbnail_path),
      },
      sketchfab_background: {
        path: product.sketchfab_background,
        exists: checkImageExists(product.sketchfab_background),
        fullUrl: convertToFullUrl(product.sketchfab_background),
      },
      product_introduction: {
        path: product.product_introduction,
        exists: checkImageExists(product.product_introduction),
        fullUrl: convertToFullUrl(product.product_introduction),
      },
      preorder_notes: {
        path: product.preorder_notes,
        exists: checkImageExists(product.preorder_notes),
        fullUrl: convertToFullUrl(product.preorder_notes),
      },
      lightslider_images: product.lightslider_images
        ? product.lightslider_images.map((img) => ({
            path: img,
            exists: checkImageExists(img),
            fullUrl: convertToFullUrl(img),
          }))
        : [],
    };

    res.json({
      success: true,
      productId,
      imageStatus,
      baseUrl: getBaseUrl(),
    });
  } catch (error) {
    console.error("檢查圖片失敗:", error);
    res.status(500).json({ error: "檢查圖片失敗", message: error.message });
  }
});

// 取得所有商品
router.get("/", async (req, res) => {
  try {
    const productResult = await query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    const products = productResult.rows || [];

    // PostgreSQL JSONB 欄位已經是 JavaScript 物件，不需要解析
    // 處理圖片路徑，轉換為完整URL
    const processedProducts = products.map((product) =>
      processProductImages(product)
    );

    res.json({ products: processedProducts });
  } catch (error) {
    console.error("取得商品失敗:", error);
    res.status(500).json({ error: "取得商品失敗", message: error.message });
  }
});

// 取得單一商品
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await get("SELECT * FROM products WHERE product_id = ?", [
      id,
    ]);

    if (!product) {
      return res.status(404).json({ error: "商品不存在" });
    }

    // PostgreSQL JSONB 欄位已經是 JavaScript 物件，不需要解析
    // 處理圖片路徑，轉換為完整URL
    const processedProduct = processProductImages(product);

    res.json({ product: processedProduct });
  } catch (error) {
    console.error("取得商品失敗:", error);
    res.status(500).json({ error: "取得商品失敗", message: error.message });
  }
});

// 新增商品
router.post(
  "/",
  express.json(), // 支持JSON格式
  async (req, res) => {
    try {
      console.log(`🔄 創建商品請求`);
      console.log(`📋 請求資料:`, JSON.stringify(req.body, null, 2));
      const {
        product_id,
        name,
        price,
        deposit,
        max_quantity,
        status,
        preorder_button_status,
        cell_open_status,
        cell_remaining_status,
        specifications,
        pickup_info,
        sketchfab_embed_link,
        sketchfab_background,
        product_introduction,
        preorder_notes,
        main_colors,
        sub_colors,
        thumbnail_path,
        lightslider_images,
      } = req.body;

      if (
        !product_id ||
        !name ||
        price === undefined ||
        deposit === undefined
      ) {
        return res.status(400).json({ error: "缺少必要欄位" });
      }

      // 檢查商品 ID 是否已存在
      const existingProduct = await get(
        "SELECT id FROM products WHERE product_id = ?",
        [product_id]
      );
      if (existingProduct) {
        return res.status(400).json({ error: "商品 ID 已存在" });
      }

      // 處理圖片路徑 (支持Base64和文件路徑)
      let thumbnailPath = thumbnail_path || null;
      let lightsliderImages = lightslider_images || [];
      let sketchfabBackgroundPath = sketchfab_background || null;
      let productIntroductionPath = product_introduction || null;
      let preorderNotesPath = preorder_notes || null;

      // 處理顏色配置
      const mainColorsJson = main_colors ? JSON.stringify(main_colors) : "[]";
      const subColorsJson = sub_colors ? JSON.stringify(sub_colors) : "[]";
      const lightsliderImagesJson = JSON.stringify(lightsliderImages);

      const result = await run(
        `INSERT INTO products (
                product_id, name, price, deposit, max_quantity, status,
                preorder_button_status, cell_open_status, cell_remaining_status,
                specifications, pickup_info, thumbnail_path, lightslider_images,
                sketchfab_embed_link, sketchfab_background, product_introduction, preorder_notes,
                main_colors, sub_colors
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          name,
          price,
          deposit,
          max_quantity || 3,
          status || "available",
          preorder_button_status || "select_style",
          cell_open_status || "preparing",
          cell_remaining_status || "still_available",
          specifications,
          pickup_info,
          thumbnailPath,
          lightsliderImagesJson,
          sketchfab_embed_link,
          sketchfabBackgroundPath || sketchfab_background || null,
          productIntroductionPath || product_introduction || null,
          preorderNotesPath || preorder_notes || null,
          mainColorsJson,
          subColorsJson,
        ]
      );

      // 以 product_id 查詢剛建立的商品（避免不同資料庫 lastID 差異）
      const product = await get("SELECT * FROM products WHERE product_id = ?", [
        product_id,
      ]);

      res.status(201).json({ success: true, product });
    } catch (error) {
      console.error("新增商品失敗:", error);
      res.status(500).json({ error: "新增商品失敗", message: error.message });
    }
  }
);

// 更新商品
router.put(
  "/:id",
  express.json(), // 支持JSON格式
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔄 更新商品請求: ${id}`);
      console.log(`📋 請求資料:`, JSON.stringify(req.body, null, 2));
      const {
        name,
        price,
        deposit,
        max_quantity,
        status,
        preorder_button_status,
        cell_open_status,
        cell_remaining_status,
        specifications,
        pickup_info,
        sketchfab_embed_link,
        sketchfab_background,
        product_introduction,
        preorder_notes,
        main_colors,
        sub_colors,
        thumbnail_path,
        lightslider_images,
      } = req.body;

      // 檢查商品是否存在
      const existingProduct = await get(
        "SELECT * FROM products WHERE product_id = ?",
        [id]
      );
      if (!existingProduct) {
        return res.status(404).json({ error: "商品不存在" });
      }

      // 處理圖片路徑 (支持Base64和文件路徑)
      let thumbnailPath =
        thumbnail_path !== undefined
          ? thumbnail_path
          : existingProduct.thumbnail_path;
      let lightsliderImages =
        lightslider_images !== undefined
          ? lightslider_images
          : existingProduct.lightslider_images || [];
      let sketchfabBackgroundPath =
        sketchfab_background !== undefined
          ? sketchfab_background
          : existingProduct.sketchfab_background || null;
      let productIntroductionPath =
        product_introduction !== undefined
          ? product_introduction
          : existingProduct.product_introduction || null;
      let preorderNotesPath =
        preorder_notes !== undefined
          ? preorder_notes
          : existingProduct.preorder_notes || null;

      // 注意：Base64圖片不需要文件系統操作，直接使用傳入的值

      // 處理顏色配置
      const mainColorsJson = main_colors
        ? JSON.stringify(main_colors)
        : existingProduct.main_colors;
      const subColorsJson = sub_colors
        ? JSON.stringify(sub_colors)
        : existingProduct.sub_colors;
      const lightsliderImagesJson = JSON.stringify(lightsliderImages);

      // 準備更新資料（缺少的欄位沿用原值）
      const updatedName = name ?? existingProduct.name;
      const updatedPrice =
        price !== undefined && price !== "" ? price : existingProduct.price;
      const updatedDeposit =
        deposit !== undefined && deposit !== ""
          ? deposit
          : existingProduct.deposit;
      const updatedMaxQty =
        max_quantity !== undefined && max_quantity !== ""
          ? max_quantity
          : existingProduct.max_quantity;
      const updatedStatus = status ?? existingProduct.status;
      const updatedPreorderBtn =
        preorder_button_status ?? existingProduct.preorder_button_status;
      const updatedCellOpen =
        cell_open_status ?? existingProduct.cell_open_status;
      const updatedCellRemain =
        cell_remaining_status ?? existingProduct.cell_remaining_status;
      const updatedSpecs = specifications ?? existingProduct.specifications;
      const updatedPickup = pickup_info ?? existingProduct.pickup_info;
      const updatedSketchfab =
        sketchfab_embed_link ?? existingProduct.sketchfab_embed_link;

      const result = await run(
        `UPDATE products SET 
                name = ?, price = ?, deposit = ?, max_quantity = ?, status = ?,
                preorder_button_status = ?, cell_open_status = ?, cell_remaining_status = ?,
                specifications = ?, pickup_info = ?, thumbnail_path = ?, lightslider_images = ?,
                sketchfab_embed_link = ?, sketchfab_background = ?, product_introduction = ?, preorder_notes = ?,
                main_colors = ?, sub_colors = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE product_id = ?`,
        [
          updatedName,
          updatedPrice,
          updatedDeposit,
          updatedMaxQty,
          updatedStatus,
          updatedPreorderBtn,
          updatedCellOpen,
          updatedCellRemain,
          updatedSpecs,
          updatedPickup,
          thumbnailPath,
          lightsliderImagesJson,
          updatedSketchfab,
          sketchfabBackgroundPath,
          productIntroductionPath,
          preorderNotesPath,
          mainColorsJson,
          subColorsJson,
          id,
        ]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "商品不存在或更新失敗" });
      }

      const updatedProduct = await get(
        "SELECT * FROM products WHERE product_id = ?",
        [id]
      );

      // 處理圖片路徑，轉換為完整URL
      const processedProduct = processProductImages(updatedProduct);

      res.json({ success: true, product: processedProduct });
    } catch (error) {
      console.error("更新商品失敗:", error);
      console.error("錯誤堆疊:", error.stack);
      console.error("請求資料:", JSON.stringify(req.body, null, 2));
      res.status(500).json({
        error: "更新商品失敗",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// 更新商品狀態和庫存
router.patch("/:id/stock", express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { max_quantity, status } = req.body;

    const result = await run(
      "UPDATE products SET max_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?",
      [max_quantity, status, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "商品不存在" });
    }

    res.json({ success: true, message: "商品庫存更新成功" });
  } catch (error) {
    console.error("更新商品庫存失敗:", error);
    res.status(500).json({ error: "更新商品庫存失敗", message: error.message });
  }
});

// 刪除商品
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 取得商品資訊
    const product = await get(
      "SELECT thumbnail_path, lightslider_images FROM products WHERE product_id = ?",
      [id]
    );
    if (!product) {
      return res.status(404).json({ error: "商品不存在" });
    }

    // 刪除縮圖檔案
    if (product.thumbnail_path) {
      const thumbnailPath = path.join(
        __dirname,
        "../..",
        product.thumbnail_path
      );
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // 刪除 LightSlider 圖片檔案
    if (
      product.lightslider_images &&
      Array.isArray(product.lightslider_images)
    ) {
      product.lightslider_images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "../..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    const result = await run("DELETE FROM products WHERE product_id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "商品不存在" });
    }

    res.json({ success: true, message: "商品刪除成功" });
  } catch (error) {
    console.error("刪除商品失敗:", error);
    res.status(500).json({ error: "刪除商品失敗", message: error.message });
  }
});

// 刪除商品圖片
router.delete("/:id/images", express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { imageType, imageIndex, deleteAll } = req.body;

    // 檢查商品是否存在
    const product = await get(
      "SELECT thumbnail_path, lightslider_images, sketchfab_background, product_introduction, preorder_notes FROM products WHERE product_id = ?",
      [id]
    );
    if (!product) {
      return res.status(404).json({ error: "商品不存在" });
    }

    if (imageType === "thumbnail") {
      // 刪除縮圖
      if (product.thumbnail_path) {
        const thumbnailPath = path.join(
          __dirname,
          "../..",
          product.thumbnail_path
        );
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
        // 清空資料庫中的縮圖路徑
        await run(
          "UPDATE products SET thumbnail_path = NULL WHERE product_id = ?",
          [id]
        );
      }
    } else if (imageType === "lightslider") {
      // 刪除 LightSlider 圖片
      if (
        product.lightslider_images &&
        Array.isArray(product.lightslider_images)
      ) {
        if (deleteAll) {
          // 刪除所有 LightSlider 圖片
          product.lightslider_images.forEach((imagePath) => {
            const fullPath = path.join(__dirname, "../..", imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
          // 清空資料庫中的 LightSlider 圖片路徑
          await run(
            "UPDATE products SET lightslider_images = NULL WHERE product_id = ?",
            [id]
          );
        } else if (imageIndex !== null && imageIndex !== undefined) {
          // 刪除指定索引的圖片
          if (
            imageIndex >= 0 &&
            imageIndex < product.lightslider_images.length
          ) {
            const imagePath = product.lightslider_images[imageIndex];
            const fullPath = path.join(__dirname, "../..", imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }

            // 從陣列中移除該圖片
            product.lightslider_images.splice(imageIndex, 1);

            // 更新資料庫
            await run(
              "UPDATE products SET lightslider_images = ? WHERE product_id = ?",
              [JSON.stringify(product.lightslider_images), id]
            );
          } else {
            return res.status(400).json({ error: "圖片索引無效" });
          }
        }
      }
    } else if (imageType === "sketchfab_background") {
      if (product.sketchfab_background) {
        const bgPath = path.join(
          __dirname,
          "../..",
          product.sketchfab_background
        );
        if (fs.existsSync(bgPath)) {
          fs.unlinkSync(bgPath);
        }
        await run(
          "UPDATE products SET sketchfab_background = NULL WHERE product_id = ?",
          [id]
        );
      }
    } else if (imageType === "product_introduction") {
      if (product.product_introduction) {
        const introPath = path.join(
          __dirname,
          "../..",
          product.product_introduction
        );
        if (fs.existsSync(introPath)) {
          fs.unlinkSync(introPath);
        }
        await run(
          "UPDATE products SET product_introduction = NULL WHERE product_id = ?",
          [id]
        );
      }
    } else if (imageType === "preorder_notes") {
      if (product.preorder_notes) {
        const notesPath = path.join(__dirname, "../..", product.preorder_notes);
        if (fs.existsSync(notesPath)) {
          fs.unlinkSync(notesPath);
        }
        await run(
          "UPDATE products SET preorder_notes = NULL WHERE product_id = ?",
          [id]
        );
      }
    } else {
      return res.status(400).json({ error: "無效的圖片類型" });
    }

    res.json({ success: true, message: "圖片刪除成功" });
  } catch (error) {
    console.error("刪除圖片失敗:", error);
    res.status(500).json({ error: "刪除圖片失敗", message: error.message });
  }
});

module.exports = router;
