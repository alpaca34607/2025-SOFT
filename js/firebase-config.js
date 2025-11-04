/**
 * Firebase 配置
 * 請在 Firebase Console 中獲取您的配置資訊
 * https://console.firebase.google.com/
 */

// Firebase 配置對象
// 請替換為您自己的 Firebase 專案配置
const firebaseConfig = {
  apiKey: "AIzaSyBSxE3_xSQfWPilQVjqhrw-Z_DU-YK0q8c",
  authDomain: "soft-83ff5.firebaseapp.com",
  projectId: "soft-83ff5",
  storageBucket: "soft-83ff5.firebasestorage.app",
  messagingSenderId: "212106439931",
  appId: "1:212106439931:web:8152690300335833b7945e",
  measurementId: "G-DG1LQNKFMG"
};

// 導出配置（如果使用模組化）
if (typeof module !== "undefined" && module.exports) {
  module.exports = firebaseConfig;
}

// 全局可用
window.firebaseConfig = firebaseConfig;
