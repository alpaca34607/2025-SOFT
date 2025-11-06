// Email.js 配置
// 請到 https://www.emailjs.com/ 註冊並取得以下資訊：
// 1. Service ID (服務ID)
// 2. Template ID (模板ID)
// 3. Public Key (公開金鑰)

const EMAILJS_CONFIG = {
  // 您的 EmailJS Service ID
  // 在 EmailJS Dashboard > Email Services 中可以找到
  SERVICE_ID: "service_pmau7cb",

  // 您的 EmailJS Template ID
  // 在 EmailJS Dashboard > Email Templates 中可以找到
  TEMPLATE_ID: "template_i6fxozm",

  // 您的 EmailJS Public Key
  // 在 EmailJS Dashboard > Account > General 中可以找到
  PUBLIC_KEY: "FwBIX63luHkD_l78l",
};

// 導出配置（如果需要）
if (typeof module !== "undefined" && module.exports) {
  module.exports = EMAILJS_CONFIG;
}
