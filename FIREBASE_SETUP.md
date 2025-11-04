# Firebase 身份驗證設定指南

本指南將幫助您設定 Firebase 身份驗證，以保護管理後台頁面。

## 📋 步驟 1: 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」或選擇現有專案
3. 按照指示完成專案建立流程

## 🔑 步驟 2: 啟用 Email/Password 身份驗證

1. 在 Firebase Console 中，進入「Authentication」頁面
2. 點擊「Get started」或「Sign-in method」標籤
3. 啟用「Email/Password」提供者
4. 點擊「Email/Password」選項
5. 啟用「Email/Password」並點擊「儲存」

## 👤 步驟 3: 建立管理員帳號

1. 在 Firebase Console 的「Authentication」頁面
2. 點擊「Users」標籤
3. 點擊「Add user」
4. 輸入管理員的電子郵件和密碼
5. 點擊「Add user」完成建立

## ⚙️ 步驟 4: 取得 Firebase 配置資訊

1. 在 Firebase Console 中，點擊專案設定（齒輪圖示）
2. 向下滾動到「Your apps」區塊
3. 如果還沒有 Web 應用程式，點擊「</> Add app」按鈕
4. 輸入應用程式暱稱（例如：軟筋生物管理後台）
5. 勾選「Also set up Firebase Hosting」（可選）
6. 點擊「Register app」
7. 複製顯示的 Firebase 配置物件

## 📝 步驟 5: 設定 Firebase 配置

1. 開啟 `js/firebase-config.js` 檔案
2. 將 Firebase Console 中的配置資訊填入：

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // 替換為您的 API Key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // 替換為您的 Auth Domain
  projectId: "YOUR_PROJECT_ID", // 替換為您的 Project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // 替換為您的 Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // 替換為您的 Messaging Sender ID
  appId: "YOUR_APP_ID", // 替換為您的 App ID
};
```

## 🔒 步驟 6: 設定 Firebase Authentication 規則（可選）

如果您想要限制只有特定電子郵件可以登入，可以在 Firebase Console 中設定：

1. 進入「Authentication」→「Settings」→「Authorized domains」
2. 確保您的網域已添加到授權網域列表

或者，您可以在後端驗證中檢查用戶的電子郵件是否在允許的管理員列表中。

## ✅ 步驟 7: 測試登入功能

1. 開啟瀏覽器，前往 `admin-login.html`
2. 使用步驟 3 中建立的管理員帳號登入
3. 登入成功後應該會自動跳轉到 `admin.html`

## 🛠️ 故障排除

### 問題：無法初始化 Firebase

**解決方案：**

- 檢查 `js/firebase-config.js` 中的配置是否正確
- 確認 Firebase SDK 已正確載入
- 檢查瀏覽器主控台是否有錯誤訊息

### 問題：登入失敗

**可能原因：**

- 帳號或密碼錯誤
- Email/Password 提供者未啟用
- Firebase 專案配置錯誤

**解決方案：**

- 確認 Firebase Console 中已啟用 Email/Password 身份驗證
- 確認帳號已在 Firebase Console 中建立
- 檢查瀏覽器主控台的錯誤訊息

### 問題：登入後無法訪問管理後台

**解決方案：**

- 檢查 `admin.html` 中的身份驗證檢查邏輯
- 確認 Firebase Auth 狀態監聽器正常運作
- 檢查瀏覽器主控台是否有 JavaScript 錯誤

## 📚 額外功能

### 重設密碼功能

如果您想要添加「忘記密碼」功能，可以在 `admin-login.html` 中添加：

```javascript
// 在 Firebase Auth 中添加
await firebase.auth().sendPasswordResetEmail(email);
```

### 多因素身份驗證（MFA）

Firebase 支援多因素身份驗證，可以在 Firebase Console 中啟用。

### 自訂驗證規則

您可以在後端 API 中添加中間件來驗證 Firebase ID Token，確保只有特定的管理員可以訪問後端 API。

## 🔐 安全性建議

1. **不要在公開倉庫中提交 Firebase 配置**

   - 將 `js/firebase-config.js` 添加到 `.gitignore`（如果包含敏感資訊）
   - 或使用環境變數來管理配置

2. **限制管理員帳號**

   - 只為需要訪問管理後台的人員建立帳號
   - 定期審查和清理未使用的帳號

3. **使用強密碼**

   - 要求管理員使用強密碼
   - 考慮啟用 Firebase 的密碼強度要求

4. **監控登入活動**
   - 在 Firebase Console 中查看 Authentication 日誌
   - 設定異常登入警報（如果使用 Firebase 的進階功能）

## 📞 需要協助？

如果您在設定過程中遇到問題，請：

1. 檢查瀏覽器主控台的錯誤訊息
2. 查看 Firebase Console 的狀態
3. 參考 [Firebase 官方文件](https://firebase.google.com/docs/auth/web/start)
