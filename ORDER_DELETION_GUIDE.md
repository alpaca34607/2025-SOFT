# 軟筋生物訂單刪除指南

本指南提供多種方式來刪除 Vercel 或 Supabase 中的訂單資料。

## 📋 目錄

1. [通過管理後台刪除](#通過管理後台刪除)
2. [通過 API 直接刪除](#通過-api-直接刪除)
3. [通過 Supabase 後台刪除](#通過-supabase-後台刪除)
4. [通過 SQL 命令刪除](#通過-sql-命令刪除)

---

## 🖥️ 通過管理後台刪除

### 前置條件
- 確保後端伺服器正在運行
- 訪問管理後台：`http://localhost:3000/admin.html` 或您的線上域名

### 操作步驟

#### 刪除單一訂單：
1. 在管理後台點擊「訂單管理」
2. 找到要刪除的訂單
3. 點擊該訂單右側的「🗑️ 刪除」按鈕
4. 確認刪除操作

#### 批量刪除所有訂單：
1. 在管理後台點擊「訂單管理」
2. 點擊頂部的「⚠️ 清空所有訂單」按鈕
3. **注意：此操作將刪除所有訂單及相關明細**
4. 需要進行兩次確認才能執行

---

## 🔌 通過 API 直接刪除

### 刪除單一訂單

```bash
# 刪除指定 ID 的訂單
curl -X DELETE "https://your-domain.vercel.app/api/orders/{ORDER_ID}" \
  -H "Content-Type: application/json"

# 本地測試範例
curl -X DELETE "http://localhost:3000/api/orders/1" \
  -H "Content-Type: application/json"
```

### 批量刪除所有訂單 (危險操作)

```bash
curl -X DELETE "https://your-domain.vercel.app/api/orders/batch/all" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_ORDERS"}'

# 本地測試範例
curl -X DELETE "http://localhost:3000/api/orders/batch/all" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_ORDERS"}'
```

### API 回應範例

成功刪除單一訂單：
```json
{
  "success": true,
  "message": "訂單 SOFT123456789ABCDE 及相關明細已成功刪除",
  "deletedOrder": "SOFT123456789ABCDE",
  "deletedItems": 2
}
```

成功批量刪除：
```json
{
  "success": true,
  "message": "所有訂單及相關明細已清空",
  "deletedOrders": 15,
  "deletedItems": 23
}
```

---

## 🗄️ 通過 Supabase 後台刪除

### 前置條件
- 有 Supabase 專案的管理權限
- 知道您的 Supabase 專案 URL

### 操作步驟

1. **登入 Supabase Dashboard**
   - 訪問：https://supabase.com/dashboard
   - 登入您的帳號
   - 選擇您的專案

2. **進入 Table Editor**
   - 在左側導航欄點擊「Table Editor」
   - 您會看到所有資料表

3. **刪除訂單明細 (order_items)**
   ```sql
   -- 在 SQL Editor 中執行
   DELETE FROM order_items WHERE order_id = {ORDER_ID};
   
   -- 或刪除所有訂單明細
   DELETE FROM order_items;
   ```

4. **刪除訂單 (orders)**
   ```sql
   -- 刪除指定訂單
   DELETE FROM orders WHERE id = {ORDER_ID};
   
   -- 或刪除所有訂單
   DELETE FROM orders;
   ```

### 注意事項
⚠️ **重要：必須先刪除 order_items，再刪除 orders，因為有外鍵約束**

---

## 💻 通過 SQL 命令刪除

### 使用 Supabase SQL Editor

1. **進入 SQL Editor**
   - 在 Supabase Dashboard 中點擊「SQL Editor」

2. **執行刪除命令**

#### 刪除指定訂單：
```sql
-- 先刪除訂單明細
DELETE FROM order_items WHERE order_id = 123;

-- 再刪除訂單
DELETE FROM orders WHERE id = 123;
```

#### 刪除指定客戶的所有訂單：
```sql
-- 刪除指定客戶的所有訂單明細
DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM orders WHERE customer_id = 456
);

-- 刪除指定客戶的所有訂單
DELETE FROM orders WHERE customer_id = 456;
```

#### 刪除所有訂單（清空資料庫）：
```sql
-- ⚠️ 危險操作：刪除所有資料
DELETE FROM order_items;
DELETE FROM orders;
```

#### 安全的條件刪除：
```sql
-- 刪除指定日期之前的訂單
DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE created_at < '2024-01-01'
);

DELETE FROM orders WHERE created_at < '2024-01-01';
```

#### 查看刪除前的資料：
```sql
-- 查看將要刪除的訂單
SELECT o.*, c.name, c.phone 
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
WHERE o.created_at < '2024-01-01';

-- 統計訂單數量
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_items FROM order_items;
```

---

## 🔒 安全建議

### 1. 備份資料
在執行刪除操作前，建議先備份重要資料：
```sql
-- 匯出訂單資料
SELECT * FROM orders ORDER BY created_at DESC;
SELECT * FROM order_items ORDER BY order_id;
```

### 2. 使用事務
對於複雜的刪除操作，使用事務確保資料一致性：
```sql
BEGIN;

DELETE FROM order_items WHERE order_id = 123;
DELETE FROM orders WHERE id = 123;

-- 檢查結果後再提交
COMMIT;
-- 或回滾
-- ROLLBACK;
```

### 3. 分階段刪除
對於大量資料，建議分批刪除：
```sql
-- 分批刪除（每次刪除 100 筆）
DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE status = 'cancelled' 
    LIMIT 100
);
```

---

## 🚨 緊急復原

如果誤刪了重要資料：

1. **Supabase 自動備份**
   - Supabase Pro 版本有自動備份功能
   - 可以從 Dashboard 復原到指定時間點

2. **從本地資料庫復原**
   - 如果有本地 SQLite 資料庫，可以重新匯入

3. **聯繫客戶重新下單**
   - 作為最後手段，可以聯繫客戶重新下單

---

## 📞 技術支援

如果遇到任何問題：
1. 檢查伺服器日誌
2. 確認資料庫連接狀態
3. 驗證 API 權限設定
4. 查看瀏覽器控制台錯誤訊息

---

**⚠️ 警告：所有刪除操作都是不可逆的，請務必謹慎操作！**