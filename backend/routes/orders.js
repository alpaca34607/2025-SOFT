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
        `INSERT INTO orders (order_number, customer_id, total_amount, deposit_amount, 
             pickup_method, payment_method, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          customer.id,
          totalAmount,
          depositAmount,
          pickupMethod,
          paymentMethod,
          note,
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

      // PostgreSQL 使用 JSONB 欄位，訂單明細已包含在 order.order_items 中

      res.status(201).json({
        success: true,
        message: "訂單建立成功",
        order: {
          ...order,
          items: orderItems,
        },
      });
    } catch (error) {
      console.error("建立訂單失敗:", error);
      res.status(500).json({ error: "建立訂單失敗", message: error.message });
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
      order.items = order.order_items || [];
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
      `SELECT o.*, c.name as customer_name, c.phone, c.email 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
             WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    const items = await query("SELECT * FROM order_items WHERE order_id = ?", [
      id,
    ]);

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

    console.log("收到更新訂單狀態請求:", {
      id,
      status,
      body: req.body,
      headers: req.headers,
    });

    if (!status) {
      return res.status(400).json({ error: "缺少狀態參數" });
    }

    // 驗證狀態值是否有效
    const validStatuses = [
      "pending",
      "confirmed",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "無效的狀態值" });
    }

    // 檢查訂單是否存在
    const existingOrder = await get("SELECT id FROM orders WHERE id = ?", [id]);
    if (!existingOrder) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    const result = await run(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );

    console.log("更新結果:", result);

    if (result.changes === 0) {
      return res.status(404).json({ error: "訂單不存在或更新失敗" });
    }

    // 取得更新後的訂單資訊
    const updatedOrder = await get(
      `SELECT o.*, c.name as customer_name, c.phone, c.email 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
             WHERE o.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "訂單狀態更新成功",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("更新訂單狀態失敗:", error);
    res.status(500).json({ error: "更新訂單狀態失敗", message: error.message });
  }
});

// 根據電話號碼查詢訂單
router.get("/search/phone/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const orderResult = await query(
      `SELECT o.*, c.name as customer_name, c.phone, c.email 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
             WHERE c.phone = ?
             ORDER BY o.created_at DESC`,
      [phone]
    );

    const orders = orderResult.rows || [];

    // 取得每個訂單的明細
    for (const order of orders) {
      order.items = order.order_items || [];
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

    // 先刪除所有訂單明細
    // PostgreSQL 使用 JSONB 欄位，不需要刪除 order_items 表格
    console.log(`🗑️ 刪除了 ${deleteItemsResult.changes} 筆訂單明細`);

    // 再刪除所有訂單
    const deleteOrdersResult = await run("DELETE FROM orders");
    console.log(`🗑️ 刪除了 ${deleteOrdersResult.changes} 筆訂單`);

    res.json({
      success: true,
      message: "所有訂單及相關明細已清空",
      deletedOrders: deleteOrdersResult.changes,
      deletedItems: deleteItemsResult.changes,
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
      `SELECT o.*, c.name as customer_name, c.phone, c.email 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
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

// 更新訂單狀態 (必須在 GET /:id 之後)
router.patch("/:id/status", express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("收到更新訂單狀態請求:", { id, status, body: req.body });

    if (!status) {
      return res.status(400).json({ error: "缺少狀態參數" });
    }

    // 驗證狀態值是否有效
    const validStatuses = [
      "pending",
      "confirmed",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "無效的狀態值" });
    }

    // 檢查訂單是否存在
    const existingOrder = await get("SELECT id FROM orders WHERE id = ?", [id]);
    if (!existingOrder) {
      return res.status(404).json({ error: "訂單不存在" });
    }

    const result = await run(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );

    console.log("更新結果:", result);

    if (result.changes === 0) {
      return res.status(404).json({ error: "訂單不存在或更新失敗" });
    }

    res.json({
      success: true,
      message: "訂單狀態更新成功",
      status: status,
    });
  } catch (error) {
    console.error("更新訂單狀態失敗:", error);
    res.status(500).json({ error: "更新訂單狀態失敗", message: error.message });
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

    // 先刪除訂單明細
    // PostgreSQL 使用 JSONB 欄位，不需要刪除 order_items 表格
    console.log(`🗑️ 刪除了 ${deleteItemsResult.changes} 筆訂單明細`);

    // 再刪除訂單主表
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
      deletedItems: deleteItemsResult.changes,
    });
  } catch (error) {
    console.error("刪除訂單失敗:", error);
    res.status(500).json({ error: "刪除訂單失敗", message: error.message });
  }
});

module.exports = router;
