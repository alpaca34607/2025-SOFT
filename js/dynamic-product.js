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
    this.mainSwiper = null;
    this.thumbsSwiper = null;
  }

  // 確保資料為陣列（後端可能回字串 JSON 或 null）
  ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
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

    // 正規化欄位，避免前端 forEach 錯誤
    if (this.productData) {
      this.productData.main_colors = this.ensureArray(
        this.productData.main_colors
      );
      this.productData.sub_colors = this.ensureArray(
        this.productData.sub_colors
      );
      this.productData.lightslider_images = this.ensureArray(
        this.productData.lightslider_images
      );
    }

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

  // 更新 Swiper 圖片輪播
  updateLightSliderImages() {
    // 重新建立 Swiper 容器，避免已初始化的結構影響
    const galleryContainer = document.querySelector(".gallery");
    if (!galleryContainer) return;

    // 清除現有的 Swiper 實例
    if (this.mainSwiper) {
      this.mainSwiper.destroy(true, true);
      this.mainSwiper = null;
    }
    if (this.thumbsSwiper) {
      this.thumbsSwiper.destroy(true, true);
      this.thumbsSwiper = null;
    }

    // 重建 HTML 結構
    galleryContainer.innerHTML = `
      <div class="swiper product-main-swiper">
        <div class="swiper-wrapper" id="productMainSwiper"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
      <div class="swiper product-thumbs-swiper">
        <div class="swiper-wrapper" id="productThumbsSwiper"></div>
      </div>
    `;

    const mainWrapper = document.getElementById("productMainSwiper");
    const thumbsWrapper = document.getElementById("productThumbsSwiper");

    // 準備圖片陣列
    let images = [];
    if (
      !this.productData.lightslider_images ||
      !Array.isArray(this.productData.lightslider_images) ||
      this.productData.lightslider_images.length === 0
    ) {
      // 使用預設圖片
      images = ["/images/shop/yellow-noisy-gradients.jpg"];
    } else {
      images = this.productData.lightslider_images;
    }

    // 建立主輪播和縮圖的 slide
    images.forEach((imagePath, index) => {
      const fullImageUrl = this.buildImageUrl(imagePath);

      // 主輪播 slide
      const mainSlide = document.createElement("div");
      mainSlide.className = "swiper-slide";
      const mainImg = document.createElement("img");
      mainImg.src = fullImageUrl;
      mainImg.alt = this.productData.name || "商品圖片";
      mainImg.onerror = () => {
        console.warn(`圖片載入失敗: ${fullImageUrl}`);
        mainImg.src = this.buildImageUrl(
          "/images/shop/yellow-noisy-gradients.jpg"
        );
      };
      mainSlide.appendChild(mainImg);
      mainWrapper.appendChild(mainSlide);

      // 縮圖 slide
      const thumbSlide = document.createElement("div");
      thumbSlide.className = "swiper-slide";
      const thumbImg = document.createElement("img");
      thumbImg.src = fullImageUrl;
      thumbImg.alt = `${this.productData.name || "商品圖片"} - 縮圖 ${
        index + 1
      }`;
      thumbImg.onerror = () => {
        thumbImg.src = this.buildImageUrl(
          "/images/shop/yellow-noisy-gradients.jpg"
        );
      };
      thumbSlide.appendChild(thumbImg);
      thumbsWrapper.appendChild(thumbSlide);
    });

    // 初始化 Swiper（確保在圖片載入後執行）
    try {
      // 先初始化縮圖 Swiper
      this.thumbsSwiper = new Swiper(".product-thumbs-swiper", {
        spaceBetween: 10,
        slidesPerView: 4,
        freeMode: true,
        watchSlidesProgress: true,
      });

      // 再初始化主 Swiper，並與縮圖 Swiper 連結
      this.mainSwiper = new Swiper(".product-main-swiper", {
        spaceBetween: 0,
        loop: images.length > 1,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        thumbs: {
          swiper: this.thumbsSwiper,
        },
        initialSlide: 0, // 確保從第一張開始
      });

      // 確保顯示第一張圖片
      if (this.mainSwiper) {
        this.mainSwiper.slideTo(0, 0);
      }
    } catch (error) {
      console.error("初始化 Swiper 失敗:", error);
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
      // 如果有元素但沒有圖片資料，隱藏該元素
      // 需要先檢查 introImage 是否存在，再隱藏，否則introImage 是 null 或 undefined會報錯
      introImage.style.display = "none";
    }

    // 更新預購注意事項圖片
    const noticeImage = document.getElementById("notice-img");
    if (noticeImage && this.productData.preorder_notes) {
      noticeImage.src = this.buildImageUrl(this.productData.preorder_notes);
      noticeImage.style.display = "block";
    } else if (noticeImage) {
      noticeImage.style.display = "none";
    }

    // 更新 Sketchfab 背景圖片
    const sketchfabBgImage = document.getElementById("sketchfab-bg");
    if (sketchfabBgImage && this.productData.sketchfab_background) {
      const sketchfabBgImage = document.getElementById("sketchfab-bg");
      if (sketchfabBgImage) {
        sketchfabBgImage.src = this.buildImageUrl(
          this.productData.sketchfab_background
        );
        sketchfabBgImage.style.display = "block";
      }
    } else if (sketchfabBgImage) {
      sketchfabBgImage.style.display = "none";
    }
  }

  // 更新顏色選項
  updateColorOptions() {
    const mainColorSelect = document.getElementById("mainColor");
    const subColorSelect = document.getElementById("subColor");
    const quantitySelect = document.getElementById("quantity");

    // 更新主色選項
    if (mainColorSelect) {
      const mainColors = this.ensureArray(this.productData.main_colors);
      mainColorSelect.innerHTML = '<option value="">請選擇主色</option>';
      mainColors.forEach((color) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = COLOR_NAMES[color] || color;
        mainColorSelect.appendChild(option);
      });
    }

    // 更新副色選項
    if (subColorSelect) {
      const subColors = this.ensureArray(this.productData.sub_colors);
      subColorSelect.innerHTML = '<option value="">請選擇副色</option>';
      subColors.forEach((color) => {
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
      const totalPrice = parseFloat(this.productData.price || 0) * quantity;
      const totalDeposit = parseFloat(this.productData.deposit || 0) * quantity;

      document.getElementById("totalPrice").textContent = totalPrice;
      document.getElementById("totalDeposit").textContent = totalDeposit;
    } else {
      document.getElementById("totalPrice").textContent = "0";
      document.getElementById("totalDeposit").textContent = "0";
    }

    // 更新按鈕狀態
    this.updateButtonStatus();
  }

  // 更新按鈕狀態
  updateButtonStatus() {
    const addToCartBtn = document.querySelector(".add-to-cart-btn");
    const checkoutBtn = document.querySelector(".checkout button");

    // 檢查是否已售完
    if (
      this.productData.preorder_button_status === "sold_out" ||
      this.productData.max_quantity === 0
    ) {
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
      return;
    }

    // 檢查顏色選擇
    const mainColor = document.getElementById("mainColor").value;
    const subColor = document.getElementById("subColor").value;
    const quantity = parseInt(document.getElementById("quantity").value) || 0;

    if (!mainColor || !subColor || !quantity) {
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "請選擇款式";
        checkoutBtn.classList.add("disabled");
        checkoutBtn.style.opacity = "0.5";
      }
    } else {
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "前往預購";
        checkoutBtn.classList.remove("disabled");
        checkoutBtn.style.opacity = "1";
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

  // 動態產品頁面的前往預購功能
  goToCheckout() {
    const mainColor = document.getElementById("mainColor").value;
    const subColor = document.getElementById("subColor").value;
    const quantity = parseInt(document.getElementById("quantity").value) || 0;

    // 驗證是否已選擇所有必要選項
    if (!mainColor || !subColor || !quantity) {
      Swal.fire({
        icon: "warning",
        title: "請完成所有選擇",
        text: "請選擇主色、副色和數量",
        confirmButtonText: "確定",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 確保商品還有庫存
    if (
      this.productData.preorder_button_status === "sold_out" ||
      this.productData.max_quantity === 0
    ) {
      Swal.fire({
        icon: "error",
        title: "商品已售完",
        text: "很抱歉，此商品已售完！",
        confirmButtonText: "確定",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 儲存完整的商品資訊到 localStorage
    const selection = {
      productId: this.productData.product_id,
      productName: this.productData.name,
      mainColor,
      mainColorName: COLOR_NAMES[mainColor] || mainColor,
      subColor,
      subColorName: COLOR_NAMES[subColor] || subColor,
      quantity,
      unitPrice: this.productData.price,
      unitDeposit: this.productData.deposit,
      totalPrice: parseFloat(this.productData.price || 0) * quantity,
      totalDeposit: parseFloat(this.productData.deposit || 0) * quantity,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("checkoutItems", JSON.stringify([selection]));

    // 導向到結帳頁面
    window.location.href = "checkout.html";
  }
}

// 當 DOM 載入完成後初始化
document.addEventListener("DOMContentLoaded", () => {
  window.dynamicProductLoader = new DynamicProductLoader();
  window.dynamicProductLoader.init();
});
