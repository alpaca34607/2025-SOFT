/**
 * 環境配置管理
 * 用於在前端讀取環境變數
 */

// 環境配置對象
window.ENV_CONFIG = {
  // 從後端 API 獲取環境配置
  async loadConfig() {
    try {
      // 嘗試從後端獲取環境配置
      const response = await fetch("/api/config");
      if (response.ok) {
        const config = await response.json();
        Object.assign(this, config);
        console.log("✅ 環境配置已載入:", config);
        return config;
      }
    } catch (error) {
      console.log("⚠️ 無法從後端獲取環境配置，使用預設值");
    }

    // 預設配置
    const defaultConfig = {
      API_BASE_URL: "http://localhost:3000",
      NODE_ENV: "development",
      PORT: 3000,
    };

    Object.assign(this, defaultConfig);
    return defaultConfig;
  },

  // 手動設置配置
  setConfig(config) {
    Object.assign(this, config);
    console.log("🔧 環境配置已手動設置:", config);
  },

  // 獲取當前配置
  getConfig() {
    return {
      API_BASE_URL: this.API_BASE_URL,
      NODE_ENV: this.NODE_ENV,
      PORT: this.PORT,
    };
  },
};

// 自動載入配置
document.addEventListener("DOMContentLoaded", async () => {
  await window.ENV_CONFIG.loadConfig();
});
