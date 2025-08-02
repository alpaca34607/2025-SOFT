const express = require("express");
const { query, get, run } = require("../database-adapter");

const router = express.Router();

// JSON body parser 將在需要的路由中單獨添加

// 取得所有客戶
router.get("/", async (req, res) => {
  try {
    const { phone, limit = 50, offset = 0 } = req.query;

    let sql = "SELECT * FROM customers";
    const params = [];

    if (phone) {
      sql += " WHERE phone LIKE ?";
      params.push(`%${phone}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error("取得客戶失敗:", error);
    res.status(500).json({ error: "取得客戶失敗", message: error.message });
  }
});

// 取得單一客戶
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await get("SELECT * FROM customers WHERE id = ?", [id]);

    if (!customer) {
      return res.status(404).json({ error: "客戶不存在" });
    }

    res.json({ customer });
  } catch (error) {
    console.error("取得客戶失敗:", error);
    res.status(500).json({ error: "取得客戶失敗", message: error.message });
  }
});

// 根據電話號碼查詢客戶
router.get("/search/phone/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await get("SELECT * FROM customers WHERE phone = ?", [
      phone,
    ]);

    if (!customer) {
      return res.status(404).json({ error: "客戶不存在" });
    }

    res.json({ customer });
  } catch (error) {
    console.error("查詢客戶失敗:", error);
    res.status(500).json({ error: "查詢客戶失敗", message: error.message });
  }
});

// 新增客戶
router.post(
  "/",
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const { name, phone, email } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: "缺少必要欄位" });
      }

      // 檢查電話號碼是否已存在
      const existingCustomer = await get(
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );
      if (existingCustomer) {
        return res.status(409).json({ error: "此電話號碼已存在" });
      }

      const result = await run(
        "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)",
        [name, phone, email]
      );

      const customer = await get("SELECT * FROM customers WHERE id = ?", [
        result.id,
      ]);

      res.status(201).json({ success: true, customer });
    } catch (error) {
      console.error("新增客戶失敗:", error);
      res.status(500).json({ error: "新增客戶失敗", message: error.message });
    }
  }
);

// 更新客戶資料
router.put(
  "/:id",
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, email } = req.body;

      const result = await run(
        "UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?",
        [name, phone, email, id]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "客戶不存在" });
      }

      const customer = await get("SELECT * FROM customers WHERE id = ?", [id]);

      res.json({ success: true, customer });
    } catch (error) {
      console.error("更新客戶失敗:", error);
      res.status(500).json({ error: "更新客戶失敗", message: error.message });
    }
  }
);

module.exports = router;
