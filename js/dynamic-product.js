// 確保 COLOR_NAMES 可用（如果未在其他文件中定義）
if (typeof COLOR_NAMES === "undefined") {
  const COLOR_NAMES = {
    black: "黑色",
    white: "白色",
    gray: "灰色",
    gold: "金色",
    silver: "銀色",
    bronze: "銅色",
    red: "紅色",
    orange: "橙色",
    yellow: "黃色",
    blue: "藍色",
    green: "綠色",
    brown: "棕色",
    none: "無顏色選項",
  };
}

// 動態商品頁面載入器
class DynamicProductLoader {
  constructor() {
    this.productId = null;
    this.productData = null;
    this.loadingElement = null;
  }

  // 構建完整的圖片 URL
  buildImageUrl(imagePath) {
    if (!imagePath) return null;

    // 如果已經是完整 URL，直接返回
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // 使用當前環境的 API base URL
    const baseURL = window.ENV_CONFIG?.API_BASE_URL || "http://localhost:3000";
    return `${baseURL}${imagePath}`;
  }

  // 初始化
  async init() {
    // 顯示載入動畫
    this.showLoading();

    try {
      // 從 URL 或 data-product-id 屬性獲取商品 ID
      this.productId = this.getProductId();
      if (!this.productId) {
        throw new Error("無法獲取商品 ID");
      }

      // 載入商品資料
      await this.loadProductData();

      // 應用商品資料到頁面
      this.applyProductData();

      // 隱藏載入動畫
      this.hideLoading();
    } catch (error) {
      console.error("載入商品資料失敗:", error);
      this.showError("載入商品資料失敗");
    }
  }

  // 獲取商品 ID
  getProductId() {
    // 從 URL 查詢參數獲取 (優先)
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get("id");
    if (productIdFromUrl) {
      return productIdFromUrl;
    }

    // 從 body 的 data-product-id 屬性獲取
    const productId = document.body.getAttribute("data-product-id");
    if (productId) {
      return productId;
    }

    // 從 URL 路徑獲取
    const path = window.location.pathname;
    const match = path.match(/product-([^.]+)\.html/);
    if (match) {
      return `product-${match[1]}`;
    }

    return null;
  }

  // 載入商品資料
  async loadProductData() {
    const response = await API.getProductById(this.productId);
    this.productData = response.product;

    if (!this.productData) {
      throw new Error("商品資料不存在");
    }
  }

  // 應用商品資料到頁面
  applyProductData() {
    // 更新頁面標題
    this.updatePageTitle();

    // 更新商品名稱
    this.updateProductName();

    // 更新價格資訊
    this.updatePriceInfo();

    // 更新規格資訊
    this.updateSpecifications();

    // 更新取貨資訊
    this.updatePickupInfo();

    // 更新 LightSlider 圖片
    this.updateLightSliderImages();

    // 更新 Sketchfab 嵌入
    this.updateSketchfabEmbed();

    // 更新商品介紹和注意事項
    this.updateProductDetails();

    // 更新顏色選項
    this.updateColorOptions();

    // 更新按鈕狀態
    this.updateButtonStatus();
  }

  // 更新頁面標題
  updatePageTitle() {
    if (this.productData.name) {
      document.title = this.productData.name;
    }
  }

  // 更新商品名稱
  updateProductName() {
    const productNameElement = document.getElementById("productName");
    if (productNameElement && this.productData.name) {
      productNameElement.textContent = this.productData.name;
    }
  }

  // 更新價格資訊
  updatePriceInfo() {
    const unitPriceElement = document.getElementById("unitPrice");
    const unitDepositElement = document.getElementById("unitDeposit");

    if (unitPriceElement && this.productData.price !== undefined) {
      unitPriceElement.textContent = this.productData.price;
    }

    if (unitDepositElement && this.productData.deposit !== undefined) {
      unitDepositElement.textContent = this.productData.deposit;
    }
  }

  // 更新規格資訊
  updateSpecifications() {
    const typeElement = document.querySelector(".type p");
    if (typeElement && this.productData.specifications) {
      typeElement.textContent = this.productData.specifications;
    }
  }

  // 更新取貨資訊
  updatePickupInfo() {
    const noticeElement = document.querySelector(".notice p");
    if (noticeElement && this.productData.pickup_info) {
      noticeElement.innerHTML = this.productData.pickup_info.replace(
        /\n/g,
        "<br>"
      );
    }
  }

  // 更新 LightSlider 圖片
  updateLightSliderImages() {
    // 重新建立 lightSlider 容器，避免已初始化的結構影響
    const galleryContainer = document.querySelector(".gallery");
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '<ul id="lightSlider"></ul>';
    const lightSliderElement = document.getElementById("lightSlider");

    // 檢查是否有圖片資料
    if (
      !this.productData.lightslider_images ||
      !Array.isArray(this.productData.lightslider_images) ||
      this.productData.lightslider_images.length === 0
    ) {
      // 使用預設圖片
      const fallbackImage = "/images/shop/yellow-noisy-gradients.jpg";
      const fullFallbackUrl = this.buildImageUrl(fallbackImage);
      const li = document.createElement("li");
      li.setAttribute("data-thumb", fullFallbackUrl);

      const img = document.createElement("img");
      img.src = fullFallbackUrl;
      img.alt = this.productData.name || "商品圖片";
      img.onerror = () => {
        console.warn(`圖片載入失敗: ${fullFallbackUrl}`);
      };

      li.appendChild(img);
      lightSliderElement.appendChild(li);
    } else {
      // 添加新的圖片，包含錯誤處理
      this.productData.lightslider_images.forEach((imagePath) => {
        const li = document.createElement("li");
        const fullImageUrl = this.buildImageUrl(imagePath);
        li.setAttribute("data-thumb", fullImageUrl);

        const img = document.createElement("img");
        img.src = fullImageUrl;
        img.alt = this.productData.name || "商品圖片";

        // 圖片載入失敗時使用預設圖片
        img.onerror = () => {
          console.warn(`圖片載入失敗: ${fullImageUrl}，使用預設圖片`);
          img.src = this.buildImageUrl(
            "/images/shop/yellow-noisy-gradients.jpg"
          );
        };

        li.appendChild(img);
        lightSliderElement.appendChild(li);
      });
    }

    // 初始化 LightSlider（確保在圖片載入後執行）
    try {
      const slider = $("#lightSlider").lightSlider({
        gallery: true,
        item: 1,
        loop: true,
        slideMargin: 0,
        thumbItem: 4,
        thumbWidth: 115,
        thumbHeight: 115,
        galleryMargin: 10,
      });
      // 強制定位到第一張
      if (slider && typeof slider.goToSlide === "function") {
        slider.goToSlide(0);
      }
    } catch (error) {
      console.error("初始化 LightSlider 失敗:", error);
    }
  }

  // 更新 Sketchfab 嵌入
  updateSketchfabEmbed() {
    const sketchfabWrapper = document.querySelector(
      ".sketchfab-embed-wrapper iframe"
    );

    if (sketchfabWrapper) {
      if (this.productData.sketchfab_embed_link) {
        sketchfabWrapper.src = this.productData.sketchfab_embed_link;
      } else {
        // 如果沒有 Sketchfab 連結，隱藏整個嵌入區域
        const wrapperContainer = sketchfabWrapper.closest(
          ".sketchfab-embed-wrapper"
        );
        if (wrapperContainer) {
          wrapperContainer.style.display = "none";
        }
      }
    }
  }

  // 更新商品介紹和注意事項
  updateProductDetails() {
    // 更新商品介紹圖片
    const introImage = document.getElementById("product-intro-img");
    if (introImage && this.productData.product_introduction) {
      introImage.src = this.buildImageUrl(
        this.productData.product_introduction
      );
      introImage.style.display = "block";
    } else if (introImage) {
      // 如果沒有商品介紹圖片，隱藏該元素
      introImage.style.display = "none";
    }

    // 更新預購注意事項圖片（只更新showcase-wrap區域的圖片）
    if (this.productData.preorder_notes) {
      const noticeImage = document.querySelector(
        '.showcase-wrap img[alt="預購注意事項"]'
      );
      if (noticeImage) {
        noticeImage.src = this.buildImageUrl(this.productData.preorder_notes);
      }
    }

    // 更新 Sketchfab 背景圖片
    if (this.productData.sketchfab_background) {
      const sketchfabBackgroundImage = document.querySelector(
        '.showcase-wrap img[alt="sketchfab背景"]'
      );
      if (sketchfabBackgroundImage) {
        sketchfabBackgroundImage.src = this.buildImageUrl(
          this.productData.sketchfab_background
        );
        sketchfabBackgroundImage.style.display = "block";
      }
    }
  }

  // 更新顏色選項
  updateColorOptions() {
    const mainColorSelect = document.getElementById("mainColor");
    const subColorSelect = document.getElementById("subColor");
    const quantitySelect = document.getElementById("quantity");

    // 更新主色選項
    if (mainColorSelect && this.productData.main_colors) {
      mainColorSelect.innerHTML = '<option value="">請選擇主色</option>';
      this.productData.main_colors.forEach((color) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = COLOR_NAMES[color] || color;
        mainColorSelect.appendChild(option);
      });
    }

    // 更新副色選項
    if (subColorSelect && this.productData.sub_colors) {
      subColorSelect.innerHTML = '<option value="">請選擇副色</option>';
      this.productData.sub_colors.forEach((color) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = COLOR_NAMES[color] || color;
        subColorSelect.appendChild(option);
      });
    }

    // 更新數量選項
    if (quantitySelect && this.productData.max_quantity) {
      quantitySelect.innerHTML = '<option value="">請選擇數量</option>';
      const maxQty = Math.min(this.productData.max_quantity, 10); // 最多10個
      for (let i = 1; i <= maxQty; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        quantitySelect.appendChild(option);
      }
    }

    // 綁定事件監聽器
    if (mainColorSelect) {
      mainColorSelect.addEventListener("change", () => this.updateSelection());
    }
    if (subColorSelect) {
      subColorSelect.addEventListener("change", () => this.updateSelection());
    }
    if (quantitySelect) {
      quantitySelect.addEventListener("change", () => this.updateSelection());
    }
  }

  // 更新選擇
  updateSelection() {
    const mainColor = document.getElementById("mainColor").value;
    const subColor = document.getElementById("subColor").value;
    const quantity = parseInt(document.getElementById("quantity").value) || 0;

    if (mainColor && subColor && quantity) {
      const totalPrice = this.productData.price * quantity;
      const totalDeposit = this.productData.deposit * quantity;

      document.getElementById("totalPrice").textContent = totalPrice;
      document.getElementById("totalDeposit").textContent = totalDeposit;
    } else {
      document.getElementById("totalPrice").textContent = "0";
      document.getElementById("totalDeposit").textContent = "0";
    }
  }

  // 更新按鈕狀態
  updateButtonStatus() {
    const addToCartBtn = document.querySelector(".add-to-cart-btn");
    const checkoutBtn = document.querySelector(".checkout button");

    if (this.productData.preorder_button_status === "sold_out") {
      if (addToCartBtn) {
        addToCartBtn.textContent = "已售完";
        addToCartBtn.disabled = true;
        addToCartBtn.style.opacity = "0.5";
      }

      if (checkoutBtn) {
        checkoutBtn.textContent = "已售完";
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.5";
      }
    }
  }

  // 顯示載入動畫
  showLoading() {
    // 創建載入動畫元素
    this.loadingElement = document.createElement("div");
    this.loadingElement.id = "loading-overlay";
    this.loadingElement.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>載入中...</p>
            </div>
        `;

    // 添加樣式
    this.loadingElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

    const spinnerStyle = `
            .loading-spinner {
                text-align: center;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

    // 添加樣式到 head
    if (!document.getElementById("loading-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "loading-styles";
      styleElement.textContent = spinnerStyle;
      document.head.appendChild(styleElement);
    }

    document.body.appendChild(this.loadingElement);
  }

  // 隱藏載入動畫
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
  }

  // 顯示錯誤訊息
  showError(message) {
    this.hideLoading();

    const errorElement = document.createElement("div");
    errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff6b6b;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
        `;
    errorElement.innerHTML = `
            <h3>載入失敗</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; background: white; color: #ff6b6b; cursor: pointer;">重新載入</button>
        `;

    document.body.appendChild(errorElement);
  }
}

// 當 DOM 載入完成後初始化
document.addEventListener("DOMContentLoaded", () => {
  const productLoader = new DynamicProductLoader();
  productLoader.init();
});
