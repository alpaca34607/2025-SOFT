/**
 * Firebase 身份驗證模組
 * 處理管理員登入、登出和身份驗證狀態管理
 */

class FirebaseAuth {
  constructor() {
    this.auth = null;
    this.user = null;
    this.initialized = false;
    this.authStateListeners = [];
  }

  // 初始化 Firebase Auth
  async init() {
    if (this.initialized) {
      return true;
    }

    try {
      // 檢查 Firebase SDK 是否已載入
      if (typeof firebase === "undefined") {
        console.error("Firebase SDK 未載入，請確保已引入 Firebase SDK");
        return false;
      }

      // 初始化 Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }

      // 獲取 Auth 實例
      this.auth = firebase.auth();

      // 立即獲取當前用戶狀態（如果存在）
      this.user = this.auth.currentUser;

      this.initialized = true;

      // 監聽身份驗證狀態變化
      // Firebase 的 onAuthStateChanged 會在初始化後自動觸發一次
      this.auth.onAuthStateChanged((user) => {
        // 更新用戶狀態
        const previousUser = this.user;
        this.user = user;

        // 通知所有監聽器（Firebase 會自動觸發，包括初始化時的觸發）
        this.notifyAuthStateListeners(user);
      });

      console.log("✅ Firebase Auth 初始化成功");
      return true;
    } catch (error) {
      console.error("❌ Firebase Auth 初始化失敗:", error);
      return false;
    }
  }

  // 註冊身份驗證狀態監聽器
  onAuthStateChanged(callback) {
    // 添加監聽器
    this.authStateListeners.push(callback);

    // 注意：不需要在這裡立即調用，因為 Firebase 的 onAuthStateChanged
    // 會在初始化後自動觸發一次，並且會通過 notifyAuthStateListeners 通知所有監聽器
    // 如果立即調用可能會導致重複觸發
  }

  // 通知所有監聽器
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error("監聽器錯誤:", error);
      }
    });
  }

  // 使用帳號密碼登入
  async signIn(email, password) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      if (!this.auth) {
        throw new Error("Firebase Auth 未初始化");
      }

      const userCredential = await this.auth.signInWithEmailAndPassword(
        email,
        password
      );
      this.user = userCredential.user;
      console.log("✅ 登入成功:", this.user.email);
      return { success: true, user: this.user };
    } catch (error) {
      console.error("❌ 登入失敗:", error);
      let errorMessage = "登入失敗，請檢查帳號密碼";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "找不到此帳號";
          break;
        case "auth/wrong-password":
          errorMessage = "密碼錯誤";
          break;
        case "auth/invalid-email":
          errorMessage = "電子郵件格式不正確";
          break;
        case "auth/user-disabled":
          errorMessage = "此帳號已被停用";
          break;
        case "auth/too-many-requests":
          errorMessage = "嘗試次數過多，請稍後再試";
          break;
        case "auth/network-request-failed":
          errorMessage = "網路連線失敗，請檢查網路連線";
          break;
      }

      return { success: false, error: errorMessage };
    }
  }

  // 登出
  async signOut() {
    try {
      if (!this.auth) {
        throw new Error("Firebase Auth 未初始化");
      }

      await this.auth.signOut();
      this.user = null;
      console.log("✅ 已登出");
      return { success: true };
    } catch (error) {
      console.error("❌ 登出失敗:", error);
      return { success: false, error: error.message };
    }
  }

  // 獲取當前用戶
  getCurrentUser() {
    return this.user;
  }

  // 檢查是否已登入
  isAuthenticated() {
    return this.user !== null;
  }

  // 獲取 ID Token（用於後端驗證）
  async getIdToken() {
    if (!this.user) {
      return null;
    }

    try {
      return await this.user.getIdToken();
    } catch (error) {
      console.error("獲取 ID Token 失敗:", error);
      return null;
    }
  }

  // 重新載入用戶資訊
  async reloadUser() {
    if (!this.user) {
      return null;
    }

    try {
      await this.user.reload();
      this.user = this.auth.currentUser;
      return this.user;
    } catch (error) {
      console.error("重新載入用戶失敗:", error);
      return null;
    }
  }
}

// 創建全局實例
window.FirebaseAuth = new FirebaseAuth();

// 如果使用模組化
if (typeof module !== "undefined" && module.exports) {
  module.exports = FirebaseAuth;
}
