const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query, get, run } = require("../database-adapter");

const router = express.Router();

// JSON body parser 將在需要的路由中單獨添加

// 調試中間件
router.use((req, res, next) => {
  console.log(`📋 訂單路由請求: ${req.method} ${req.path}`);
  next();
});

// 檢查資料庫schema的端點（用於調試）
router.get("/debug/schema", async (req, res) => {
  try {
    const { query } = require("../database-adapter");

    // 檢查 orders 表的結構
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    // 檢查是否有 order_number 欄位
    const orderNumberExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_number'
      ) as exists
    `);

    res.json({
      success: true,
      table_structure: tableInfo.rows,
      order_number_exists: orderNumberExists.rows[0].exists,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("檢查schema失敗:", error);
    res.status(500).json({
      error: "檢查schema失敗",
      message: error.message,
    });
  }
});

// 手動運行遷移的端點（用於調試）
router.post("/debug/migrate", async (req, res) => {
  try {
    console.log("🔄 手動運行資料庫遷移...");
    const { addOrderNumberColumn } = require("../migrate-add-order-number");
    await addOrderNumberColumn();

    const {
      addPaymentPickupColumns,
    } = require("../migrate-add-payment-pickup");
    await addPaymentPickupColumns();

    res.json({
      success: true,
      message: "資料庫遷移完成",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("手動遷移失敗:", error);
    res.status(500).json({
      error: "手動遷移失敗",
      message: error.message,
      stack: error.stack,
    });
  }
});

// 建立新訂單
router.post(
  "/",
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const { customerInfo, items, pickupMethod, paymentMethod, note } =
        req.body;

      // 驗證必要欄位
      if (!customerInfo || !items || !pickupMethod || !paymentMethod) {
        return res.status(400).json({ error: "缺少必要欄位" });
      }

      // 驗證並記錄訂單項資訊
      console.log("📦 訂單項資料:", JSON.stringify(items, null, 2));
      items.forEach((item, index) => {
        console.log(`📦 訂單項 ${index + 1}:`, {
          productId: item.productId,
          productName: item.productName,
          mainColor: item.mainColor,
          mainColorName: item.mainColorName,
          subColor: item.subColor,
          subColorName: item.subColorName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitDeposit: item.unitDeposit,
          totalPrice: item.totalPrice,
          totalDeposit: item.totalDeposit,
        });
      });

      // 檢查客戶是否存在，不存在則建立
      let customer = await get("SELECT * FROM customers WHERE phone = ?", [
        customerInfo.phone,
      ]);
      console.log("現有客戶:", customer);

      if (!customer) {
        console.log("建立新客戶...", customerInfo);
        const customerResult = await run(
          "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)",
          [customerInfo.name, customerInfo.phone, customerInfo.email]
        );
        console.log("客戶建立結果:", customerResult);
        customer = { id: customerResult.lastID };
        console.log("最終客戶物件:", customer);
      }

      // 計算總金額
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const depositAmount = items.reduce(
        (sum, item) => sum + item.totalDeposit,
        0
      );

      // 建立訂單
      const orderNumber = `SOFT${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`;

      const orderResult = await run(
        `INSERT INTO orders (customer_name, customer_phone, customer_email, order_items, total_amount, deposit_amount, 
             status, notes, order_number, payment_method, pickup_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerInfo.name,
          customerInfo.phone,
          customerInfo.email,
          JSON.stringify(items),
          totalAmount,
          depositAmount,
          "pending",
          note,
          orderNumber,
          paymentMethod,
          pickupMethod,
        ]
      );

      console.log("訂單建立結果:", orderResult);
      console.log("customer.id:", customer.id);
      console.log("orderResult.lastID:", orderResult.lastID);

      // PostgreSQL 使用 JSONB 欄位存儲訂單明細，不需要額外插入

      // 取得完整訂單資訊
      const order = await get(
        `SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
             FROM orders o 
             WHERE o.id = ?`,
        [orderResult.lastID]
      );

      // 解析訂單明細 (PostgreSQL JSONB 可能已經是對象)
      let orderItems;
      if (typeof order.order_items === "string") {
        orderItems = JSON.parse(order.order_items || "[]");
      } else {
        orderItems = order.order_items || [];
      }

      res.status(201).json({
        success: true,
        message: "訂單建立成功",
        order: {
          ...order,
          order_number: orderNumber,
          items: orderItems,
        },
      });
    } catch (error) {
      console.error("建立訂單失敗:", error);
      console.error("錯誤堆疊:", error.stack);
      console.error("請求資料:", {
        customerInfo: req.body?.customerInfo,
        items: req.body?.items?.length,
        pickupMethod: req.body?.pickupMethod,
        paymentMethod: req.body?.paymentMethod,
        note: req.body?.note,
      });
      res.status(500).json({
        error: "建立訂單失敗",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// 取得所有訂單
router.get("/", async (req, res) => {
  try {
    const { status, phone, limit = 50, offset = 0 } = req.query;

    let sql = `
            SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
            FROM orders o
        `;
    const params = [];

    // 篩選條件
    const conditions = [];
    if (status) {
      conditions.push("o.status = ?");
      params.push(status);
    }
    if (phone) {
      conditions.push("o.customer_phone LIKE ?");
      params.push(`%${phone}%`);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const orderResult = await query(sql, params);
    const orders = orderResult.rows || [];

    // 取得每個訂單的明細
    for (const order of orders) {
      // 解析 order_items JSONB 字段
      let orderItems = order.order_items || [];

      // 如果是字符串，需要解析 JSON
      if (typeof orderItems === "string") {
        try {
          orderItems = JSON.parse(orderItems);
        } catch (e) {
          console.error("解析 order_items 失敗:", e);
          orderItems = [];
        }
      }

      // 確保是陣列格式
      if (!Array.isArray(orderItems)) {
        orderItems = [];
      }

      // 轉換字段命名為下划线格式以兼容前端顯示
      order.items = orderItems.map((item) => ({
        product_id: item.productId || item.product_id,
        product_name: item.productName || item.product_name,
        main_color: item.mainColor || item.main_color,
        main_color_name: item.mainColorName || item.main_color_name,
        sub_color: item.subColor || item.sub_color,
        sub_color_name: item.subColorName || item.sub_color_name,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price,
        unit_deposit: item.unitDeposit || item.unit_deposit,
        total_price: item.totalPrice || item.total_price,
        total_deposit: item.totalDeposit || item.total_deposit,
      }));
    }

    res.json({ orders });
  } catch (error) {
    console.error("取得訂單失敗:", error);
    res.status(500).json({ error: "取得訂單失敗", message: error.message });
  }
});

// 取得單一訂單
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await get(
      `SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
              FROM orders o 
              WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    // 解析 order_items JSONB 字段
    let orderItems = order.order_items || [];

    // 如果是字符串，需要解析 JSON
    if (typeof orderItems === "string") {
      try {
        orderItems = JSON.parse(orderItems);
      } catch (e) {
        console.error("解析 order_items 失敗:", e);
        orderItems = [];
      }
    }

    // 確保是陣列格式
    if (!Array.isArray(orderItems)) {
      orderItems = [];
    }

    // 轉換字段命名為下划线格式以兼容前端顯示
    const items = orderItems.map((item) => ({
      product_id: item.productId || item.product_id,
      product_name: item.productName || item.product_name,
      main_color: item.mainColor || item.main_color,
      main_color_name: item.mainColorName || item.main_color_name,
      sub_color: item.subColor || item.sub_color,
      sub_color_name: item.subColorName || item.sub_color_name,
      quantity: item.quantity,
      unit_price: item.unitPrice || item.unit_price,
      unit_deposit: item.unitDeposit || item.unit_deposit,
      total_price: item.totalPrice || item.total_price,
      total_deposit: item.totalDeposit || item.total_deposit,
    }));

    res.json({ order: { ...order, items } });
  } catch (error) {
    console.error("取得訂單失敗:", error);
    res.status(500).json({ error: "取得訂單失敗", message: error.message });
  }
});

// 更新訂單狀態
router.patch("/:id/status", express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("📝 收到更新訂單狀態請求:", {
      id,
      idType: typeof id,
      status,
      body: req.body,
    });

    if (!status) {
      return res.status(400).json({ error: "缺少狀態參數" });
    }

    // 驗證狀態值是否有效
    const validStatuses = [
      "pending",
      "confirmed",
      "depositPaid",
      "fullPaid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "無效的狀態值" });
    }

    // orders 表的 id 是 UUID 類型，直接使用字串
    const orderId = id;

    // 驗證 UUID 格式（簡單檢查）
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error("❌ 訂單 ID 不是有效的 UUID:", orderId);
      return res.status(400).json({ error: "無效的訂單 ID 格式" });
    }

    // 檢查訂單是否存在並獲取當前狀態
    const existingOrder = await get(
      "SELECT id, status FROM orders WHERE id = ?",
      [orderId]
    );
    if (!existingOrder) {
      console.error("❌ 訂單不存在:", orderId);
      return res.status(404).json({ error: "訂單不存在" });
    }

    console.log("📋 訂單當前狀態:", existingOrder.status, "→ 新狀態:", status);

    // 執行更新
    let result;
    try {
      result = await run(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, orderId]
      );
      console.log("✅ 更新結果:", {
        changes: result.changes,
        lastID: result.lastID,
      });
    } catch (updateError) {
      console.error("❌ UPDATE 語句執行失敗:", updateError);
      console.error(
        "SQL:",
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      console.error("參數:", [status, orderId]);
      throw updateError;
    }

    // 注意：PostgreSQL 的 rowCount 可能為 0 即使更新成功（如果新值與舊值相同）
    // 但我們仍然需要驗證實際的狀態是否改變
    if (result.changes === 0) {
      console.warn("⚠️ 更新結果顯示沒有行被更新，但繼續驗證實際狀態...");
    }

    // 驗證更新是否成功：重新查詢訂單
    const updatedOrder = await get(
      `SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
              FROM orders o 
              WHERE o.id = ?`,
      [orderId]
    );

    if (!updatedOrder) {
      console.error("❌ 更新後無法取得訂單:", orderId);
      return res.status(500).json({ error: "更新後無法取得訂單資訊" });
    }

    if (updatedOrder.status !== status) {
      console.error("❌ 狀態驗證失敗:", {
        期望: status,
        實際: updatedOrder.status,
      });
      return res.status(500).json({
        error: "狀態更新驗證失敗",
        expected: status,
        actual: updatedOrder.status,
      });
    }

    console.log("✅ 訂單狀態更新成功並驗證通過:", {
      orderId,
      舊狀態: existingOrder.status,
      新狀態: updatedOrder.status,
    });

    res.json({
      success: true,
      message: "訂單狀態更新成功",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ 更新訂單狀態失敗:", error);
    console.error("錯誤名稱:", error.name);
    console.error("錯誤訊息:", error.message);
    console.error("錯誤堆疊:", error.stack);
    console.error("錯誤詳情:", {
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
    });

    // 提供更詳細的錯誤訊息給前端
    const errorMessage = error.detail || error.message || "更新訂單狀態失敗";
    res.status(500).json({
      error: "更新訂單狀態失敗",
      message: errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? {
              code: error.code,
              detail: error.detail,
              hint: error.hint,
              stack: error.stack,
            }
          : undefined,
    });
  }
});

// 根據電話號碼查詢訂單
router.get("/search/phone/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const orderResult = await query(
      `SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
              FROM orders o 
              WHERE o.customer_phone = ?
              ORDER BY o.created_at DESC`,
      [phone]
    );

    const orders = orderResult.rows || [];

    // 取得每個訂單的明細
    for (const order of orders) {
      // 解析 order_items JSONB 字段
      let orderItems = order.order_items || [];

      // 如果是字符串，需要解析 JSON
      if (typeof orderItems === "string") {
        try {
          orderItems = JSON.parse(orderItems);
        } catch (e) {
          console.error("解析 order_items 失敗:", e);
          orderItems = [];
        }
      }

      // 確保是陣列格式
      if (!Array.isArray(orderItems)) {
        orderItems = [];
      }

      // 轉換字段命名為下划线格式以兼容前端顯示
      order.items = orderItems.map((item) => ({
        product_id: item.productId || item.product_id,
        product_name: item.productName || item.product_name,
        main_color: item.mainColor || item.main_color,
        main_color_name: item.mainColorName || item.main_color_name,
        sub_color: item.subColor || item.sub_color,
        sub_color_name: item.subColorName || item.sub_color_name,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price,
        unit_deposit: item.unitDeposit || item.unit_deposit,
        total_price: item.totalPrice || item.total_price,
        total_deposit: item.totalDeposit || item.total_deposit,
      }));
    }

    res.json({ orders });
  } catch (error) {
    console.error("查詢訂單失敗:", error);
    res.status(500).json({ error: "查詢訂單失敗", message: error.message });
  }
});

// 批量刪除訂單 (危險操作，建議僅管理員使用) - 必須在 /:id 之前
router.delete("/batch/all", express.json(), async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== "DELETE_ALL_ORDERS") {
      return res.status(400).json({
        error: '請在請求 body 中提供確認字串: {"confirm": "DELETE_ALL_ORDERS"}',
      });
    }

    console.log("⚠️ 執行批量刪除所有訂單...");

    // PostgreSQL 使用 JSONB 欄位，訂單明細已包含在 orders 表中
    // 直接刪除所有訂單即可
    const deleteOrdersResult = await run("DELETE FROM orders");
    console.log(`🗑️ 刪除了 ${deleteOrdersResult.changes} 筆訂單`);

    res.json({
      success: true,
      message: "所有訂單及相關明細已清空",
      deletedOrders: deleteOrdersResult.changes,
      deletedItems: 0, // PostgreSQL 使用 JSONB，沒有獨立的 order_items 表
    });
  } catch (error) {
    console.error("批量刪除訂單失敗:", error);
    res.status(500).json({ error: "批量刪除訂單失敗", message: error.message });
  }
});

// 取得單一訂單 (必須在最後，因為會匹配任何 /:id 格式)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await get(
      `SELECT o.*, o.customer_name, o.customer_phone as phone, o.customer_email as email 
              FROM orders o 
              WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    // 取得訂單明細
    const orderItems = await query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );

    order.items = orderItems.rows || [];

    res.json({ order });
  } catch (error) {
    console.error("取得訂單失敗:", error);
    res.status(500).json({ error: "取得訂單失敗", message: error.message });
  }
});

// 刪除訂單 (包含訂單明細) - 必須在最後
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ 嘗試刪除訂單: ${id}`);

    // 檢查訂單是否存在
    const order = await get("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    console.log(`📋 找到訂單: ${order.order_number}`);

    // PostgreSQL 使用 JSONB 欄位，訂單明細已包含在 orders 表中
    // 直接刪除訂單即可
    const deleteOrderResult = await run("DELETE FROM orders WHERE id = ?", [
      id,
    ]);
    console.log(`🗑️ 刪除了 ${deleteOrderResult.changes} 筆訂單`);

    if (deleteOrderResult.changes === 0) {
      return res.status(404).json({ error: "訂單刪除失敗" });
    }

    res.json({
      success: true,
      message: `訂單 ${order.order_number} 及相關明細已成功刪除`,
      deletedOrder: order.order_number,
      deletedItems: 0, // PostgreSQL 使用 JSONB，沒有獨立的 order_items 表
    });
  } catch (error) {
    console.error("刪除訂單失敗:", error);
    res.status(500).json({ error: "刪除訂單失敗", message: error.message });
  }
});

module.exports = router;
