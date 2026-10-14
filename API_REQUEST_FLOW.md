# API 請求完整流程圖與程式片段說明

> 本文件描述目前的同源 API 設計。部署時請透過後端的
> `PUBLIC_API_URL` 或前端環境設定提供跨域 API 網址；文件中的舊部署網址
> 不再使用。

## 📊 完整流程圖

```mermaid
flowchart TD
    Start([用戶提交表單<br/>checkout.js]) --> CheckAPI{檢查 API 模組<br/>是否可用?}

    CheckAPI -->|API 不存在| Error1[顯示錯誤訊息<br/>系統服務暫時無法使用]
    CheckAPI -->|API 存在| PrepareData[準備訂單資料<br/>orderData]

    PrepareData --> CallCreateOrder[調用 API.createOrder<br/>orderData]

    CallCreateOrder --> RequestMethod[進入 request 方法<br/>endpoint='/api/orders']

    RequestMethod --> GetBaseURL[調用 getDynamicBaseURL<br/>動態獲取 baseURL]

    GetBaseURL --> TryFetchConfig{嘗試 fetch<br/>'/api/config'}

    TryFetchConfig -->|成功| ParseConfig[解析配置<br/>config.API_BASE_URL]
    TryFetchConfig -->|失敗| UseDefault[使用智能預設值<br/>getSmartDefaultURL]

    ParseConfig --> CheckHostname{檢查 hostname}
    UseDefault --> CheckHostname

    CheckHostname -->|非本機| SameOriginURL[window.location.origin]
    CheckHostname -->|localhost| LocalURL[http://localhost:3000]

    SameOriginURL --> CombineURL[組合完整 URL<br/>baseURL + endpoint]
    LocalURL --> CombineURL

    CombineURL --> CheckFormData{檢查 body<br/>是否為 FormData?}

    CheckFormData -->|是 FormData| EmptyHeaders[headers = {}<br/>讓瀏覽器自動處理]
    CheckFormData -->|不是 FormData| JSONHeaders[headers = {<br/>'Content-Type': 'application/json'}]

    EmptyHeaders --> MergeOptions[合併選項<br/>finalOptions]
    JSONHeaders --> MergeOptions

    MergeOptions --> SendFetch[發送 fetch 請求<br/>fetch url, finalOptions]

    SendFetch --> CheckResponse{檢查響應<br/>response.ok?}

    CheckResponse -->|成功| ParseJSON[解析 JSON<br/>response.json]
    CheckResponse -->|失敗| GetErrorText[取得錯誤文字<br/>response.text]

    GetErrorText --> TryParseError{嘗試解析<br/>錯誤 JSON?}

    TryParseError -->|成功| ErrorJSON[使用 JSON 錯誤資料]
    TryParseError -->|失敗| ErrorText[使用文字錯誤訊息]

    ErrorJSON --> CreateError[建立 Error 物件<br/>附加 response 和 status]
    ErrorText --> CreateError

    CreateError --> ThrowError[拋出錯誤<br/>throw error]

    ParseJSON --> ReturnResult[返回結果<br/>return json]

    ThrowError --> CatchError[catch 區塊<br/>記錄錯誤]
    CatchError --> ReThrow[重新拋出錯誤<br/>throw error]

    ReturnResult --> SuccessHandler[成功處理<br/>checkout.js]
    ReThrow --> ErrorHandler[錯誤處理<br/>checkout.js]

    SuccessHandler --> ShowSuccess[顯示成功訊息<br/>訂單編號]
    ErrorHandler --> ShowError[顯示錯誤訊息<br/>請稍後再試]

    Error1 --> End([結束])
    ShowSuccess --> End
    ShowError --> End

    style Start fill:#e1f5ff
    style ReturnResult fill:#c8e6c9
    style ThrowError fill:#ffcdd2
    style ShowSuccess fill:#c8e6c9
    style ShowError fill:#ffcdd2
```

## 📝 程式片段說明

### 階段 1: 前端調用層 (checkout.js)

#### 1.1 檢查 API 模組可用性

```javascript
// js/checkout.js (160-170)
if (typeof API === "undefined" || typeof API.createOrder !== "function") {
  Swal.fire({
    icon: "error",
    title: "系統服務暫時無法使用",
    text: "請稍後再試或聯繫客服！",
  });
  return;
}
```

**用意**: 在發送請求前，先確認 API 模組已正確載入，避免後續錯誤。

#### 1.2 準備訂單資料

```javascript
// js/checkout.js (174-184)
const orderData = {
  customerInfo: {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  },
  items: checkoutItems,
  pickupMethod: formData.get("pickupMethod"),
  paymentMethod: formData.get("paymentMethod"),
  note: formData.get("note"),
};
```

**用意**: 將表單資料整理成後端期望的格式。

#### 1.3 調用 API 方法

```javascript
// js/checkout.js (195)
const result = await API.createOrder(orderData);
```

**用意**: 調用封裝好的 API 方法，傳入訂單資料。

---

### 階段 2: API 封裝層 (api.js - createOrder)

#### 2.1 定義 API 方法

```javascript
// js/api.js (176-181)
static async createOrder(orderData) {
  return this.request("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}
```

**用意**:

- 提供語義化的方法名稱
- 硬編碼端點路徑 `/api/orders`
- 指定 HTTP 方法為 `POST`
- 將資料轉換為 JSON 字串

---

### 階段 3: 請求處理層 (api.js - request)

#### 3.1 動態獲取 Base URL

```javascript
// js/api.js (69-72)
static async request(endpoint, options = {}) {
  const baseURL = await this.getDynamicBaseURL();
  const url = `${baseURL}${endpoint}`;
```

**用意**:

- 每次請求都動態獲取最新的 baseURL，確保配置是最新的
- 組合完整的請求 URL

#### 3.2 獲取 Base URL 的邏輯

```javascript
// js/api.js (46-58)
static async getDynamicBaseURL() {
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const config = await response.json();
      return config.API_BASE_URL;
    }
  } catch (error) {
    console.log("⚠️ 無法動態獲取配置，使用預設值");
  }
  return this.getSmartDefaultURL();
}
```

**用意**:

- **優先**: 從後端 `/api/config` 端點獲取配置（最準確）
- **後備**: 如果失敗，使用智能預設值判斷

#### 3.3 智能預設值判斷

```javascript
// js/api.js (20-43)
static getSmartDefaultURL() {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return window.location.origin;
}
```

**用意**:

- 根據當前頁面的 hostname 自動判斷環境
- 不同環境使用不同的 API URL
- 本地開發時使用 `localhost:3000`

#### 3.4 處理 FormData 特殊情況

```javascript
// js/api.js (74-83)
const isFormData = options.body instanceof FormData;

const defaultOptions = {
  headers: isFormData
    ? {}
    : {
        "Content-Type": "application/json",
      },
};
```

**用意**:

- **FormData**: 不設置 `Content-Type`，讓瀏覽器自動添加 `boundary` 參數
- **JSON**: 設置 `Content-Type: application/json`，告訴後端這是 JSON 資料

#### 3.5 合併請求選項

```javascript
// js/api.js (85-92)
const finalOptions = {
  ...defaultOptions,
  ...options,
  headers: {
    ...defaultOptions.headers,
    ...options.headers,
  },
};
```

**用意**:

- 合併預設選項和傳入選項
- **特別處理 headers**: 確保預設的 `Content-Type` 不會被完全覆蓋
- 允許調用者添加額外的 headers（如 `Authorization`）

#### 3.6 發送 HTTP 請求

```javascript
// js/api.js (94-95)
try {
  const response = await fetch(url, finalOptions);
```

**用意**: 使用瀏覽器原生的 `fetch` API 發送 HTTP 請求。

---

### 階段 4: 響應處理層 (api.js - request)

#### 4.1 檢查響應狀態

```javascript
// js/api.js (97-116)
if (!response.ok) {
  const errorText = await response.text();
  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch {
    errorData = {
      error: `HTTP ${response.status}: ${response.statusText}`,
      message: errorText.substring(0, 200),
    };
  }
  const errorMessage =
    errorData.message ||
    errorData.error ||
    `HTTP error! status: ${response.status}`;
  const error = new Error(errorMessage);
  error.response = errorData;
  error.status = response.status;
  throw error;
}
```

**用意**:

- 檢查 HTTP 狀態碼（`response.ok` 檢查 200-299 範圍）
- 如果失敗，嘗試解析錯誤訊息（可能是 JSON 或純文字）
- 建立包含完整錯誤資訊的 Error 物件
- 附加 `response` 和 `status` 屬性，方便調試

#### 4.2 解析成功響應

```javascript
// js/api.js (119)
return await response.json();
```

**用意**: 將響應的 JSON 資料解析為 JavaScript 物件並返回。

#### 4.3 錯誤捕獲與重新拋出

```javascript
// js/api.js (120-123)
} catch (error) {
  console.error("API 請求失敗:", error);
  throw error;
}
```

**用意**:

- 記錄錯誤到控制台（方便開發者調試）
- 重新拋出錯誤，讓調用者（checkout.js）處理

---

### 階段 5: 調用者處理層 (checkout.js)

#### 5.1 成功處理

```javascript
// js/checkout.js (195-215)
const result = await API.createOrder(orderData);
console.log("✅ 訂單提交成功:", result);

// 清空購物車
localStorage.removeItem("cartItems");
localStorage.removeItem("checkoutItems");

// 顯示成功訊息
Swal.fire({
  icon: "success",
  title: "訂單建立成功！",
  html: `訂單編號: <strong>${result.order.order_number}</strong>`,
});
```

**用意**:

- 處理成功響應
- 清空購物車資料
- 顯示成功訊息給用戶
- 顯示訂單編號

#### 5.2 錯誤處理

```javascript
// js/checkout.js (216-239)
} catch (error) {
  console.error("表單提交過程中發生錯誤:", error);

  // 恢復按鈕狀態
  submitButton.textContent = "送出預購單";
  submitButton.disabled = false;

  // 顯示錯誤訊息
  let errorMessage = "表單提交失敗";
  if (error.message) {
    errorMessage += `: ${error.message}`;
  }

  Swal.fire({
    icon: "error",
    title: "表單提交失敗",
    html: `${errorMessage}<br>請稍後再試或聯繫客服！`,
  });
}
```

**用意**:

- 捕獲並記錄錯誤
- 恢復 UI 狀態（按鈕文字和禁用狀態）
- 顯示用戶友好的錯誤訊息

---

## 🔑 關鍵設計要點

### 1. **分層架構**

```
調用層 (checkout.js)
  ↓
封裝層 (API.createOrder)
  ↓
處理層 (API.request)
  ↓
網路層 (fetch)
```

### 2. **錯誤向上傳播**

- 底層（request）負責記錄錯誤
- 上層（checkout.js）負責用戶體驗處理

### 3. **動態配置**

- 每次請求都獲取最新配置
- 多層後備機制確保可靠性

### 4. **類型適配**

- 自動處理 JSON 和 FormData
- 正確設置 Content-Type

### 5. **用戶體驗**

- 載入狀態提示
- 清晰的錯誤訊息
- 成功後的資料清理

---

## 📌 完整請求範例

### 請求流程

```
1. checkout.js: API.createOrder(orderData)
   ↓
2. api.js: this.request("/api/orders", { method: "POST", body: "..." })
   ↓
3. api.js: getDynamicBaseURL()
   ↓
4. fetch("/api/config") → 獲取 baseURL
   ↓
5. 組合 URL: `${API_BASE_URL}/api/orders`
   ↓
6. 合併選項: { method: "POST", headers: {...}, body: "..." }
   ↓
7. fetch(url, finalOptions)
   ↓
8. 後端處理: POST /api/orders
   ↓
9. 返回響應: { success: true, order: {...} }
   ↓
10. 解析 JSON → 返回給 checkout.js
   ↓
11. checkout.js: 顯示成功訊息
```

### 實際請求範例

```http
POST ${API_BASE_URL}/api/orders
Content-Type: application/json

{
  "customerInfo": {
    "name": "張三",
    "phone": "0912345678",
    "email": "test@example.com"
  },
  "items": [...],
  "pickupMethod": "store",
  "paymentMethod": "atm",
  "note": "請小心包裝"
}
```
