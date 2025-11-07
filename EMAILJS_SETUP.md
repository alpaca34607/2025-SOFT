# Email.js 設置指南

本指南將幫助您設置 Email.js 來發送聯繫表單的郵件。

## 📋 步驟 1: 註冊 Email.js 帳號

1. 前往 [Email.js 官網](https://www.emailjs.com/)
2. 點擊右上角的 **"Sign Up"** 註冊帳號（免費版即可）
3. 完成註冊並登入

## 📧 步驟 2: 設置 Email Service（郵件服務）

1. 登入後，進入 **Dashboard**
2. 點擊左側選單的 **"Email Services"**
3. 點擊 **"Add New Service"**
4. 選擇您想要使用的郵件服務提供商：
   - **Gmail**（推薦，最簡單）
   - **Outlook**
   - **Yahoo**
   - 或其他支援的服務
5. 按照提示連接您的郵件帳號
6. 完成後，記下您的 **Service ID**（例如：`service_xxxxxxx`）

### 設置 Gmail（推薦）

1. 選擇 **Gmail**
2. 點擊 **"Connect Account"**
3. 使用您的 Gmail 帳號登入
4. 允許 Email.js 存取您的郵件
5. 完成後，您會看到 Service ID

## 📝 步驟 3: 創建 Email Template（郵件模板）

1. 在 Dashboard 中，點擊左側選單的 **"Email Templates"**
2. 點擊 **"Create New Template"**
3. 設置模板內容：

### 模板設定範例：

**Template Name**: `contact_form`（或您喜歡的名稱）

**Subject（主旨）**:

```
新聯絡表單：{{subject}}
```

**Content（內容）**:

```
您好！

收到來自聯繫表單的新訊息：

姓名：{{from_name}}
信箱：{{from_email}}
主旨：{{subject}}

訊息內容：
{{message}}

---
此郵件由聯絡表單自動發送
```

4. **⚠️ 重要：設置收件人地址（To Email）**

   在模板設置頁面中，找到 **"To Email"** 欄位，這是必填項目！

   - 輸入您想要接收聯絡表單郵件的信箱地址
   - 例如：`your-email@gmail.com`
   - 這個地址將是接收所有表單提交的郵件地址

   > ⚠️ **注意**：如果沒有設置 "To Email"，會出現 "The recipients address is empty" 錯誤（422 狀態碼）

5. 在模板中，您可以使用以下變數（對應到表單欄位）：

   - `{{from_name}}` - 姓名
   - `{{from_email}}` - 信箱
   - `{{subject}}` - 主旨
   - `{{message}}` - 訊息內容
   - `{{reply_to}}` - 回覆地址（自動設定為寄件者信箱）

6. 點擊 **"Save"** 保存模板
7. 記下您的 **Template ID**（例如：`template_xxxxxxx`）

## 🔑 步驟 4: 獲取 Public Key（公開金鑰）

1. 在 Dashboard 中，點擊左側選單的 **"Account"** → **"General"**
2. 找到 **"Public Key"** 欄位
3. 複製您的 Public Key（例如：`xxxxxxxxxxxxxxxxxxxx`）

## ⚙️ 步驟 5: 配置您的專案

1. 打開 `js/email-config.js` 文件
2. 將以下三個值替換為您剛才記錄的值：

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: "您的Service_ID", // 步驟 2 獲取的
  TEMPLATE_ID: "您的Template_ID", // 步驟 3 獲取的
  PUBLIC_KEY: "您的Public_Key", // 步驟 4 獲取的
};
```

### 範例：

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_abc123",
  TEMPLATE_ID: "template_xyz789",
  PUBLIC_KEY: "abcdefghijklmnopqrstuvwxyz123456",
};
```

## ✅ 步驟 6: 測試設置

1. 打開您的網站
2. 點擊「聯絡軟筋」按鈕
3. 填寫測試表單
4. 點擊「送出」
5. 檢查您的郵件收件匣，應該會收到測試郵件

## 🐛 常見問題

### 問題 1: 郵件沒有發送成功

**解決方法**:

- 檢查瀏覽器控制台（F12）是否有錯誤訊息
- 確認 `email-config.js` 中的三個 ID 都正確填寫
- 確認 Email.js Service 已正確連接
- 檢查 Email.js Dashboard 中的使用限額（免費版每月有 200 封郵件限制）

### 問題 2: 收到錯誤訊息 "Invalid template parameters"

**解決方法**:

- 確認 Email Template 中使用的變數名稱與 `contactsoft.js` 中發送的參數名稱一致
- 檢查模板中是否有未定義的變數

### 問題 3: Gmail 連接失敗

**解決方法**:

- 確認您的 Gmail 帳號已啟用「允許較不安全的应用程式存取」（或使用應用程式密碼）
- 或選擇其他郵件服務提供商

## 📚 更多資源

- [Email.js 官方文檔](https://www.emailjs.com/docs/)
- [Email.js 範例](https://www.emailjs.com/examples/)

## 🔒 安全性提示

1. **Public Key** 可以安全地放在前端代碼中，因為它只能發送郵件，無法讀取或修改任何內容
2. 建議將 `email-config.js` 加入 `.gitignore`（如果包含敏感資訊），或使用環境變數
3. 免費版每月有 200 封郵件限制，如需更多請考慮升級

---

設置完成後，您的聯繫表單就可以自動發送郵件了！🎉
