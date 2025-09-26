// API 基礎設定
// 注意：API_BASE_URL 現在通過 baseURL getter 動態獲取

// API 請求工具函數
class API {
  static get baseURL() {
    // 使用環境配置中的 API_BASE_URL
    if (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) {
      console.log(`🔧 使用環境配置 API URL: ${window.ENV_CONFIG.API_BASE_URL}`);
      return window.ENV_CONFIG.API_BASE_URL;
    }

    // 智能預設值
    const defaultURL = this.getSmartDefaultURL();
    console.log(`🔧 使用智能預設 API URL: ${defaultURL}`);
    return defaultURL;
  }

  // 智能判斷預設 URL
  static getSmartDefaultURL() {
    const hostname = window.location.hostname;

    // 如果是你的 Railway 正式網域，使用當前來源（避免請求到 localhost）
    if (hostname.endsWith("soft-creature.up.railway.app")) {
      return window.location.origin;
    }

    // 如果是 Vercel 部署
    if (hostname.includes("vercel.app")) {
      return "https://2025-soft-staging.up.railway.app";
    }

    // 如果是 Railway 部署
    if (hostname.includes("railway.app")) {
      return "https://2025-soft-staging.up.railway.app";
    }
    // 正式：你的 Railway production 網域 → 用目前來源
    if (hostname.endsWith("soft-creature.up.railway.app")) {
      return window.location.origin;
    }
    // 其他 Railway 部署（預設視為 staging）
    if (hostname.includes("railway.app")) {
      return "https://2025-soft-staging.up.railway.app";
    }

    // 本地開發環境
    return "http://localhost:3000";
  }

  // 動態獲取 API URL（用於確保獲取最新配置）
  static async getDynamicBaseURL() {
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const config = await response.json();
        console.log(`🔧 動態獲取 API URL: ${config.API_BASE_URL}`);
        return config.API_BASE_URL;
      }
    } catch (error) {
      console.log("⚠️ 無法動態獲取配置，使用預設值");
    }
    return this.getSmartDefaultURL();
  }

  // 獲取當前環境資訊
  static getEnvironmentInfo() {
    const currentURL = this.baseURL;
    return {
      current: currentURL,
      source: window.ENV_CONFIG?.API_BASE_URL ? "環境變數" : "預設值",
    };
  }

  static async request(endpoint, options = {}) {
    // 使用動態獲取的 URL 以確保獲取最新配置
    const baseURL = await this.getDynamicBaseURL();
    const url = `${baseURL}${endpoint}`;

    // 如果 body 是 FormData，不設置 Content-Type（讓瀏覽器自動處理）
    const isFormData = options.body instanceof FormData;

    const defaultOptions = {
      headers: isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          },
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API 請求失敗:", error);
      throw error;
    }
  }

  // 取得預簽名 URL（後端會回 uploadUrl/publicUrl）
  static async getPresignedUrl(file, folder = "images/products") {
    const payload = {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    };
    return this.request("/api/uploads/presign", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // 直傳到 S3（PUT 預簽名 URL）
  static async uploadToS3(uploadUrl, file) {
    const resp = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`S3 上傳失敗: ${resp.status} ${resp.statusText} ${text}`);
    }
    return true;
  }

  // 刪除 S3 物件：接受 key 或 URL
  static async deleteS3Object(keyOrUrl) {
    const payload = {};
    if (keyOrUrl.startsWith("http")) payload.url = keyOrUrl;
    else payload.key = keyOrUrl;
    return this.request("/api/uploads/delete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // 健康檢查
  static async checkHealth() {
    try {
      const result = await this.request("/api/health");
      return result.status === "success";
    } catch (error) {
      console.error("API 健康檢查失敗:", error);
      return false;
    }
  }

  // 訂單相關 API
  static async createOrder(orderData) {
    return this.request("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  static async getOrders() {
    return this.request("/api/orders");
  }

  static async getOrderById(orderId) {
    return this.request(`/api/orders/${orderId}`);
  }

  static async searchOrdersByPhone(phone) {
    return this.request(`/api/orders/search/phone/${phone}`);
  }

  static async updateOrderStatus(orderId, status) {
    console.log("發送更新訂單狀態請求:", { orderId, status });
    return this.request(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // 產品相關 API
  static async getProducts() {
    return this.request("/api/products");
  }

  static async getProductById(productId) {
    return this.request(`/api/products/${productId}`);
  }

  // 將文件轉換為Base64
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 上傳圖片並獲取Base64 URL
  static async uploadImageToBase64(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${this.baseURL}/api/products/upload-base64`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`圖片上傳失敗: ${response.statusText}`);
    }

    const result = await response.json();
    return result.imageUrl;
  }

  static async createProduct(productData) {
    const processedData = { ...productData };

    // 改為：S3 預簽名直傳，回貼 publicUrl
    const imageFields = [
      "thumbnail_path",
      "sketchfab_background",
      "product_introduction",
      "preorder_notes",
    ];

    for (const field of imageFields) {
      if (productData[field] instanceof File) {
        const file = productData[field];
        try {
          const { uploadUrl, publicUrl } = await this.getPresignedUrl(
            file,
            "images/products"
          );
          await this.uploadToS3(uploadUrl, file);
          processedData[field] = publicUrl;
        } catch (error) {
          console.error(`S3 上傳 ${field} 失敗:`, error);
          throw new Error(`上傳${field}圖片失敗: ${error.message}`);
        }
      }
    }

    // 多圖
    if (
      productData.lightslider_images &&
      Array.isArray(productData.lightslider_images)
    ) {
      processedData.lightslider_images = [];
      for (const item of productData.lightslider_images) {
        if (item instanceof File) {
          try {
            const { uploadUrl, publicUrl } = await this.getPresignedUrl(
              item,
              "images/products"
            );
            await this.uploadToS3(uploadUrl, item);
            processedData.lightslider_images.push(publicUrl);
          } catch (error) {
            console.error("S3 上傳 LightSlider 圖片失敗:", error);
            throw new Error(`上傳LightSlider圖片失敗: ${error.message}`);
          }
        } else {
          processedData.lightslider_images.push(item);
        }
      }
    }

    // 轉換為JSON格式發送
    const jsonData = {
      ...processedData,
      main_colors: processedData.main_colors,
      sub_colors: processedData.sub_colors,
    };

    return this.request("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });
  }

  static async updateProduct(productId, productData) {
    const processedData = { ...productData };

    const imageFields = [
      "thumbnail_path",
      "sketchfab_background",
      "product_introduction",
      "preorder_notes",
    ];

    for (const field of imageFields) {
      if (productData[field] instanceof File) {
        const file = productData[field];
        try {
          const { uploadUrl, publicUrl } = await this.getPresignedUrl(
            file,
            "images/products"
          );
          await this.uploadToS3(uploadUrl, file);
          processedData[field] = publicUrl;
        } catch (error) {
          console.error(`S3 上傳 ${field} 失敗:`, error);
          throw new Error(`上傳${field}圖片失敗: ${error.message}`);
        }
      }
    }

    if (
      productData.lightslider_images &&
      Array.isArray(productData.lightslider_images)
    ) {
      processedData.lightslider_images = [];
      for (const item of productData.lightslider_images) {
        if (item instanceof File) {
          try {
            const { uploadUrl, publicUrl } = await this.getPresignedUrl(
              item,
              "images/products"
            );
            await this.uploadToS3(uploadUrl, item);
            processedData.lightslider_images.push(publicUrl);
          } catch (error) {
            console.error("S3 上傳 LightSlider 圖片失敗:", error);
            throw new Error(`上傳LightSlider圖片失敗: ${error.message}`);
          }
        } else {
          processedData.lightslider_images.push(item);
        }
      }
    }

    // 轉換為JSON格式發送
    const jsonData = {
      ...processedData,
      main_colors: processedData.main_colors,
      sub_colors: processedData.sub_colors,
    };

    return this.request(`/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });
  }

  static async deleteProduct(productId) {
    return this.request(`/api/products/${productId}`, {
      method: "DELETE",
    });
  }

  static async updateProductStock(productId, stockData) {
    return this.request(`/api/products/${productId}/stock`, {
      method: "PATCH",
      body: JSON.stringify(stockData),
    });
  }

  // 這些方法已移除，因為前台現在會動態載入後台資料
  static async generateProductConfig() {
    return { success: true, message: "前台現在會自動從後台載入商品配置" };
  }

  static async updateProductConfigFile() {
    return { success: true, message: "前台現在會自動從後台載入商品配置" };
  }

  // 客戶相關 API
  static async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/api/customers?${queryString}`
      : "/api/customers";
    return this.request(endpoint);
  }

  static async getCustomerById(customerId) {
    return this.request(`/api/customers/${customerId}`);
  }

  static async createCustomer(customerData) {
    return this.request("/api/customers", {
      method: "POST",
      body: JSON.stringify(customerData),
    });
  }

  static async updateCustomer(customerId, customerData) {
    return this.request(`/api/customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify(customerData),
    });
  }

  static async deleteCustomer(customerId) {
    return this.request(`/api/customers/${customerId}`, {
      method: "DELETE",
    });
  }
}

// 全域 API 健康檢查函數
async function checkAPIHealth() {
  try {
    const isHealthy = await API.checkHealth();
    if (isHealthy) {
      console.log("✅ API 連接正常:", await API.request("/api/health"));
    } else {
      console.log("❌ API 連接失敗");
    }
    return isHealthy;
  } catch (error) {
    console.error("❌ API 健康檢查失敗:", error);
    return false;
  }
}

// 錯誤處理工具
function handleAPIError(error, fallbackMessage = "操作失敗") {
  console.error("API 錯誤:", error);

  // 顯示用戶友好的錯誤訊息
  const message = error.message || fallbackMessage;

  // 如果是網路錯誤，提示用戶檢查連接
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    alert("無法連接到伺服器，請檢查網路連接或稍後再試");
  } else {
    alert(message);
  }
}

// 載入狀態管理
class LoadingManager {
  constructor() {
    this.loadingElements = new Set();
  }

  show(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = "block";
      this.loadingElements.add(elementId);
    }
  }

  hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = "none";
      this.loadingElements.delete(elementId);
    }
  }

  hideAll() {
    this.loadingElements.forEach((id) => this.hide(id));
  }
}

// 全域載入管理器
const loadingManager = new LoadingManager();

// 將 API 類別和健康檢查函數設為全域可用
window.API = API;
window.checkAPIHealth = checkAPIHealth;
window.handleAPIError = handleAPIError;
window.loadingManager = loadingManager;

// 確保函數在模組載入後立即可用
console.log("API 模組已載入，可用函數:", {
  API: typeof API,
  checkAPIHealth: typeof checkAPIHealth,
  handleAPIError: typeof handleAPIError,
  loadingManager: typeof loadingManager,
});
