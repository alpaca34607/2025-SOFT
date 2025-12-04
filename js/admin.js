// 管理後台功能

// 全局變量存儲 API base URL
let globalAPIBaseURL = null;

// 初始化 API base URL
async function initializeAPIBaseURL() {
  if (globalAPIBaseURL) return globalAPIBaseURL;

  // 嘗試從 window.ENV_CONFIG 獲取
  if (window.ENV_CONFIG?.API_BASE_URL) {
    globalAPIBaseURL = window.ENV_CONFIG.API_BASE_URL;
    return globalAPIBaseURL;
  }

  // 如果 ENV_CONFIG 還沒載入，嘗試動態獲取
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const config = await response.json();
      globalAPIBaseURL = config.API_BASE_URL;
      console.log(`🔧 動態獲取管理後台 API URL: ${globalAPIBaseURL}`);
      return globalAPIBaseURL;
    }
  } catch (error) {
    console.log("⚠️ 無法動態獲取環境配置，使用預設 API URL");
  }

  // 預設值
  globalAPIBaseURL = "http://localhost:3000";
  return globalAPIBaseURL;
}

// 構建完整的圖片 URL（同步版本）
function buildImageUrl(imagePath) {
  if (!imagePath) return null;

  // 如果已經是完整 URL，直接返回
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 使用全局 API base URL
  const baseURL = globalAPIBaseURL || "http://localhost:3000";
  return `${baseURL}${imagePath}`;
}

// 格式化時間為台北時間
function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 等待認證完成後初始化
async function initializeAdmin() {
  // 檢查是否已認證
  if (!window.adminAuthenticated) {
    // 如果還沒有認證標誌，等待認證完成
    // 這會在 admin.html 的認證檢查完成後設置
    return;
  }

  // 初始化 API base URL
  await initializeAPIBaseURL();

  initializeNavigation();
  loadDashboard();
}

// 頁面載入時初始化（但等待認證）
document.addEventListener("DOMContentLoaded", async () => {
  // 初始化認證標誌（如果還沒有設置）
  if (typeof window.adminAuthenticated === "undefined") {
    window.adminAuthenticated = false;
  }

  // 檢查認證狀態
  if (window.adminAuthenticated) {
    // 如果已經認證，立即初始化
    await initializeAdmin();
  } else {
    // 如果還沒有認證標誌，等待認證完成
    // 監聽認證完成事件（使用自定義事件）
    const authCheckHandler = () => {
      if (window.adminAuthenticated) {
        window.removeEventListener("adminAuthenticated", authCheckHandler);
        initializeAdmin();
      }
    };
    window.addEventListener("adminAuthenticated", authCheckHandler);

    // 也使用輪詢作為備用方案（以防事件沒有觸發）
    const checkAuth = setInterval(() => {
      if (window.adminAuthenticated) {
        clearInterval(checkAuth);
        window.removeEventListener("adminAuthenticated", authCheckHandler);
        initializeAdmin();
      }
    }, 100);

    // 設置超時，避免無限等待
    // 如果超時仍未認證，應該已經被重定向到登入頁面
    setTimeout(() => {
      clearInterval(checkAuth);
      window.removeEventListener("adminAuthenticated", authCheckHandler);
      if (!window.adminAuthenticated) {
        console.warn("認證檢查超時，如果未重定向到登入頁面，請檢查認證流程");
        // 不再執行初始化，因為未認證的用戶應該已經被重定向
      }
    }, 3000);
  }
});

// 初始化導航
function initializeNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const contentSections = document.querySelectorAll(".content-section");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSection = button.dataset.section;

      // 更新按鈕狀態
      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // 顯示對應內容
      contentSections.forEach((section) => {
        section.style.display = "none";
      });
      document.getElementById(targetSection).style.display = "block";

      // 載入對應資料
      switch (targetSection) {
        case "dashboard":
          loadDashboard();
          break;
        case "orders":
          loadOrders();
          break;
        case "products":
          loadProducts();
          break;
        case "customers":
          loadCustomers();
          break;
        case "banner":
          loadBannerManagement();
          break;
      }
    });
  });
}

// 載入儀表板
async function loadDashboard() {
  try {
    const isAPIHealthy = await checkAPIHealth();
    if (!isAPIHealthy) {
      showError("無法連接到伺服器");
      return;
    }

    // 載入統計資料
    const [ordersData, customersData] = await Promise.all([
      API.getOrders({ limit: 1000 }),
      API.getCustomers({ limit: 1000 }),
    ]);

    updateDashboardStats(ordersData.orders, customersData.customers);
    updateRecentOrders(ordersData.orders.slice(0, 5));
  } catch (error) {
    handleAPIError(error, "載入儀表板失敗");
  }
}

// 更新儀表板統計
function updateDashboardStats(orders, customers) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0
  );
  const totalDepositRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.deposit_amount || 0),
    0
  );
  const totalCustomers = customers.length;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("pendingOrders").textContent = pendingOrders;
  document.getElementById("totalRevenue").textContent =
    totalRevenue.toLocaleString();
  document.getElementById("totalDepositRevenue").textContent =
    totalDepositRevenue.toLocaleString();
  document.getElementById("totalCustomers").textContent = totalCustomers;
}

// 更新最近訂單
function updateRecentOrders(orders) {
  const container = document.getElementById("recentOrders");

  if (orders.length === 0) {
    container.innerHTML = "<h3>最近訂單</h3><p>尚無訂單</p>";
    return;
  }

  const ordersHTML = orders
    .map(
      (order) => `
        <div class="order-item">
            <div class="order-header" onclick="toggleOrderDetails('recent-order-${
              order.id
            }')">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fa-solid fa-angle-down order-header-toggle collapsed" id="toggle-recent-order-${
                      order.id
                    }"></i>
                    <div>
                        <strong>訂單編號: ${order.order_number}</strong><br>
                        <small>客戶: ${order.customer_name} (${
        order.phone
      })</small><br>
                        <small>建立時間: ${formatDateTime(
                          order.created_at
                        )}</small>
                    </div>
                </div>
                <span class="order-status status-${
                  order.status
                }">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details collapsed" id="recent-order-${order.id}">
                <p><strong>總金額: NT$ ${parseFloat(
                  order.total_amount || 0
                ).toLocaleString()}</strong></p>
                <p>訂金: NT$ ${parseFloat(
                  order.deposit_amount || 0
                ).toLocaleString()}</p>
                <p>取貨方式: ${getPickupMethodText(order.pickup_method)}</p>
                <p>付款方式: ${getPaymentMethodText(order.payment_method)}</p>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = `<h3>最近訂單</h3>${ordersHTML}`;
}

// 載入訂單列表
async function loadOrders() {
  const container = document.getElementById("ordersList");
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const statusFilter = document.getElementById("statusFilter").value;
    const phoneFilter = document.getElementById("phoneFilter").value;

    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (phoneFilter) params.phone = phoneFilter;

    const data = await API.getOrders(params);
    displayOrders(data.orders);
  } catch (error) {
    handleAPIError(error, "載入訂單失敗");
    container.innerHTML = '<div class="error">載入訂單失敗</div>';
  }
}

// 顯示訂單列表
function displayOrders(orders) {
  const container = document.getElementById("ordersList");

  if (orders.length === 0) {
    container.innerHTML = "<p>沒有找到訂單</p>";
    return;
  }

  const ordersHTML = orders
    .map(
      (order, index) => `
        <div class="order-item">
            <div class="order-header" onclick="toggleOrderDetails('order-${
              order.id
            }')">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fa-solid fa-angle-down order-header-toggle collapsed" id="toggle-order-${
                      order.id
                    }"></i>
                    <div>
                        <strong>訂單編號: ${order.order_number}</strong><br>
                        <small>客戶: ${order.customer_name} (${
        order.phone
      })</small><br>
                        <small>建立時間: ${formatDateTime(
                          order.created_at
                        )}</small>
                    </div>
                </div>
                <div>
                    <select class="status-select" data-order-id="${
                      order.id
                    }" onclick="event.stopPropagation();">
                        <option value="pending" ${
                          order.status === "pending" ? "selected" : ""
                        }>待處理</option>
                        <option value="confirmed" ${
                          order.status === "confirmed" ? "selected" : ""
                        }>已確認</option>
                        <option value="depositPaid" ${
                          order.status === "depositPaid" ? "selected" : ""
                        }>已付訂金</option>
                        <option value="fullPaid" ${
                          order.status === "fullPaid" ? "selected" : ""
                        }>已付全款</option>
                        <option value="shipped" ${
                          order.status === "shipped" ? "selected" : ""
                        }>已出貨</option>
                        <option value="completed" ${
                          order.status === "completed" ? "selected" : ""
                        }>已完成</option>
                        <option value="cancelled" ${
                          order.status === "cancelled" ? "selected" : ""
                        }>已取消</option>
                    </select>

                </div>
            </div>
            <div class="order-details collapsed" id="order-${order.id}">
                <p><strong>總金額: NT$ ${parseFloat(
                  order.total_amount || 0
                ).toLocaleString()}</strong></p>
                <p>訂金: NT$ ${parseFloat(
                  order.deposit_amount || 0
                ).toLocaleString()}</p>
                <p>取貨方式: ${getPickupMethodText(order.pickup_method)}</p>
                <p>付款方式: ${getPaymentMethodText(order.payment_method)}</p>
                ${order.note ? `<p>備註: ${order.note}</p>` : ""}
                ${
                  order.items && order.items.length > 0
                    ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <strong>商品明細:</strong>
                        ${order.items
                          .map((item) => {
                            // 兼容驼峰和下划线命名格式
                            const productName =
                              item.product_name ||
                              item.productName ||
                              "未知商品";
                            const mainColorName =
                              item.main_color_name ||
                              item.mainColorName ||
                              "未選擇";
                            const subColorName =
                              item.sub_color_name ||
                              item.subColorName ||
                              "未選擇";
                            const quantity = item.quantity || 0;
                            const unitPrice =
                              item.unit_price || item.unitPrice || 0;
                            const unitDeposit =
                              item.unit_deposit || item.unitDeposit || 0;

                            return `
                            <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                              <p><strong>${productName}</strong></p>
                              <p>主色: ${mainColorName}</p>
                              <p>副色: ${subColorName}</p>
                              <p>數量: ${quantity}</p>
                              <p>單價: NT$ ${unitPrice}</p>
                              <p>單件訂金: NT$ ${unitDeposit}</p>
                            </div>
                          `;
                          })
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
             <button data-order-id="${order.id}" data-order-number="${
        order.order_number
      }" class="btn-delete delete-order-btn" onclick="event.stopPropagation();" style="">🗑️ 刪除</button>
        </div>
    `
    )
    .join("");

  container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button id="deleteAllOrdersBtn" class="btn-delete">⚠️ 清空所有訂單</button>
        </div>
        ${ordersHTML}
    `;

  // 綁定狀態選擇器事件
  const statusSelects = container.querySelectorAll(".status-select");
  statusSelects.forEach((select) => {
    select.addEventListener("change", async function () {
      // orders 表的 id 是 UUID 類型，直接使用字串
      const orderId = this.dataset.orderId;
      const status = this.value;
      console.log("🔔 狀態選擇器變更事件觸發:", { orderId, status });
      await updateOrderStatus(orderId, status);
    });
  });

  // 綁定刪除所有訂單按鈕事件
  const deleteAllBtn = container.querySelector("#deleteAllOrdersBtn");
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", deleteAllOrders);
  }

  // 綁定單個訂單刪除按鈕事件
  const deleteButtons = container.querySelectorAll(".delete-order-btn");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // orders 表的 id 是 UUID 類型，直接使用字串
      const orderId = this.dataset.orderId;
      const orderNumber = this.dataset.orderNumber;
      deleteOrder(orderId, orderNumber);
    });
  });
}

// 切換訂單詳情展開/收合
function toggleOrderDetails(orderId) {
  const detailsElement = document.getElementById(orderId);
  const toggleIcon = document.getElementById(`toggle-${orderId}`);

  if (!detailsElement) return;

  // 切換收合狀態
  const isCollapsed = detailsElement.classList.contains("collapsed");

  if (isCollapsed) {
    // 展開
    detailsElement.classList.remove("collapsed");
    if (toggleIcon) {
      toggleIcon.classList.remove("collapsed");
    }
  } else {
    // 收合
    detailsElement.classList.add("collapsed");
    if (toggleIcon) {
      toggleIcon.classList.add("collapsed");
    }
  }
}

// 更新訂單狀態
async function updateOrderStatus(orderId, status) {
  try {
    // orders 表的 id 是 UUID 類型，直接使用字串，不要轉換為數字
    const orderIdStr = String(orderId);

    // 驗證 UUID 格式（簡單檢查）
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderIdStr)) {
      console.warn("⚠️ 訂單 ID 可能不是標準 UUID 格式:", orderIdStr);
      // 不拋出錯誤，因為可能是舊格式的 ID
    }

    console.log("🔄 開始更新訂單狀態:", {
      orderId: orderIdStr,
      status,
      orderIdType: typeof orderId,
    });

    // 保存當前篩選條件
    const currentStatusFilter =
      document.getElementById("statusFilter")?.value || "";
    const currentPhoneFilter =
      document.getElementById("phoneFilter")?.value || "";

    // 調用 API 更新狀態
    const result = await API.updateOrderStatus(orderIdStr, status);
    console.log("📥 API 回應:", result);

    // 驗證更新是否成功
    if (!result) {
      throw new Error("API 沒有返回結果");
    }

    if (!result.success) {
      throw new Error(result.error || result.message || "更新失敗");
    }

    // 驗證返回的訂單狀態是否正確
    if (result.order && result.order.status !== status) {
      console.warn("⚠️ 狀態不一致:", {
        期望: status,
        實際: result.order.status,
      });
      // 不拋出錯誤，但記錄警告
    }

    // 如果當前有狀態篩選，且更新的訂單狀態與篩選不符，清除狀態篩選以顯示所有訂單
    // 這樣可以確保更新後的訂單能被看到
    if (currentStatusFilter && currentStatusFilter !== status) {
      const statusFilterEl = document.getElementById("statusFilter");
      if (statusFilterEl) {
        statusFilterEl.value = "";
        console.log("✅ 清除狀態篩選以顯示更新後的訂單");
      }
    }

    // 顯示成功提示
    showSuccessToast(`訂單狀態已更新為: ${getStatusText(status)}`);

    // 等待一小段時間確保資料庫更新完成
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 重新載入訂單列表
    await loadOrders();

    // 在背景刷新儀表板數據，確保切換到儀表板時能看到最新狀態
    // 使用 Promise.all 並行執行，提高效率
    loadDashboard().catch((error) => {
      console.warn("⚠️ 刷新儀表板數據失敗（不影響訂單更新）:", error);
    });
  } catch (error) {
    console.error("❌ 更新訂單狀態失敗:", error);
    console.error("錯誤詳情:", {
      message: error.message,
      status: error.status,
      response: error.response,
      stack: error.stack,
    });

    // 顯示詳細的錯誤訊息
    let errorMessage = error.message || "更新訂單狀態失敗";
    if (error.response) {
      if (error.response.details) {
        console.error("後端錯誤詳情:", error.response.details);
        errorMessage =
          error.response.details.detail ||
          error.response.details.message ||
          errorMessage;
      } else if (error.response.message) {
        errorMessage = error.response.message;
      }
    }

    alert(`更新訂單狀態失敗: ${errorMessage}\n\n請查看控制台以獲取更多詳情。`);
    // 重新載入訂單列表以恢復原始狀態
    await loadOrders();
  }
}

// 載入商品列表
async function loadProducts() {
  // 清理 LightSlider 預覽狀態和 Object URL
  if (window.lightsliderPreviewUrls) {
    window.lightsliderPreviewUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    window.lightsliderPreviewUrls = null;
  }
  window.lightsliderImageState = null;

  const container = document.getElementById("productsList");
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const data = await API.getProducts();
    displayProducts(data.products);
  } catch (error) {
    handleAPIError(error, "載入商品失敗");
    container.innerHTML = '<div class="error">載入商品失敗</div>';
  }
}

// 顯示商品列表
function displayProducts(products) {
  const container = document.getElementById("productsList");

  if (products.length === 0) {
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button onclick="showAddProductForm()" class="btn-add">新增商品</button>
            <button onclick="syncProductConfig()" class="btn-sync">同步前端配置</button>
        </div>
        <p>沒有找到商品</p>
    `;
    return;
  }

  const productsHTML = products
    .map(
      (product) => `
        <div class="order-item">
            <div class="order-header" onclick="toggleOrderDetails('product-${
              product.product_id
            }')">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fa-solid fa-angle-down order-header-toggle collapsed" id="toggle-product-${
                      product.product_id
                    }"></i>
                    <div>
                        <a href="./product.html?id=${
                          product.product_id
                        }" target="_blank" onclick="event.stopPropagation();">${
        product.name
      }</a>
                        <small>商品ID: ${product.product_id}</small>
                    </div>
                </div>
                <div>
                    <button onclick="event.stopPropagation(); editProduct('${
                      product.product_id
                    }')" class="btn-edit">編輯</button>
                    <button onclick="event.stopPropagation(); deleteProduct('${
                      product.product_id
                    }')" class="btn-delete">刪除</button>
                </div>
            </div>
            <div class="order-details collapsed" id="product-${
              product.product_id
            }">
                <p>價格: NT$ ${product.price.toLocaleString()}</p>
                <p>訂金: NT$ ${product.deposit.toLocaleString()}</p>
                <p>最大數量: ${product.max_quantity}</p>
                <p>狀態: ${getProductStatusText(product.status)}</p>
                <p>預購按鈕狀態: ${getPreorderButtonStatusText(
                  product.preorder_button_status
                )}</p>
                <p>開放狀態: ${getCellOpenStatusText(
                  product.cell_open_status
                )}</p>
                <p>餘量狀態: ${getCellRemainingStatusText(
                  product.cell_remaining_status
                )}</p>
                ${
                  product.specifications
                    ? `<p>規格: ${product.specifications}</p>`
                    : ""
                }
                ${
                  product.pickup_info
                    ? `<p>取貨資訊: ${product.pickup_info}</p>`
                    : ""
                }
                ${
                  product.thumbnail_path
                    ? `<p>縮圖: <img src="${buildImageUrl(
                        product.thumbnail_path
                      )}" alt="${
                        product.name
                      }" style="max-width: 100px; max-height: 100px;"></p>`
                    : ""
                }
                ${
                  product.lightslider_images &&
                  product.lightslider_images.length > 0
                    ? `<p>LightSlider圖片: ${product.lightslider_images.length} 張</p>`
                    : ""
                }
                ${
                  product.sketchfab_embed_link
                    ? `<p>Sketchfab連結: ${product.sketchfab_embed_link}</p>`
                    : ""
                }
                ${
                  product.product_introduction
                    ? `<p>商品介紹: ${product.product_introduction.substring(
                        0,
                        100
                      )}${
                        product.product_introduction.length > 100 ? "..." : ""
                      }</p>`
                    : ""
                }
                ${
                  product.preorder_notes
                    ? `<p>預購注意事項: ${product.preorder_notes.substring(
                        0,
                        100
                      )}${product.preorder_notes.length > 100 ? "..." : ""}</p>`
                    : ""
                }
                <p>主色選項: ${
                  Array.isArray(product.main_colors)
                    ? product.main_colors.join(", ")
                    : product.main_colors || "無"
                }</p>
                <p>副色選項: ${
                  Array.isArray(product.sub_colors)
                    ? product.sub_colors.join(", ")
                    : product.sub_colors || "無"
                }</p>
                <p>建立時間: ${formatDateTime(product.created_at)}</p>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button onclick="showAddProductForm()" class="btn-add">新增商品</button>
            <button onclick="syncProductConfig()" class="btn-sync">同步前端配置</button>
        </div>
        ${productsHTML}
    `;
}

// 顯示新增商品表單
function showAddProductForm() {
  const container = document.getElementById("productsList");

  // 從前台的 shopping.js 中獲取顏色選項
  const getFrontendColors = () => {
    // 嘗試從前台的 shopping.js 中讀取顏色配置
    const frontendColors = [
      "black",
      "white",
      "gray",
      "gold",
      "silver",
      "bronze",
      "red",
      "orange",
      "yellow",
      "blue",
      "green",
      "brown",
      "none",
    ];

    const colorNames = {
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

    return { colors: frontendColors, names: colorNames };
  };

  const { colors: availableColors, names: colorNames } = getFrontendColors();

  // 生成顏色選項的HTML
  const generateColorCheckboxes = (prefix, defaultColors = []) => {
    return availableColors
      .map(
        (color) => `
            <label class="color-checkbox">
                <input type="checkbox" name="${prefix}Colors" value="${color}" 
                       ${defaultColors.includes(color) ? "checked" : ""}>
                <span class="color-label">${colorNames[color]}</span>
            </label>
        `
      )
      .join("");
  };

  container.innerHTML = `
        <div class="product-form">
            <h3>新增商品</h3>
            <form id="addProductForm">
                <div class="form-group">
                    <label>商品ID:</label>
                    <input type="text" id="productId" required>
                </div>
                <div class="form-group">
                    <label>商品名稱:</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label>價格:</label>
                    <input type="number" id="productPrice" required>
                </div>
                <div class="form-group">
                    <label>訂金:</label>
                    <input type="number" id="productDeposit" required>
                </div>
                <div class="form-group">
                    <label>最大數量:</label>
                    <input type="number" id="productMaxQuantity" value="3">
                </div>
                <div class="form-group">
                    <label>狀態:</label>
                    <select id="productStatus">
                        <option value="available">可購買</option>
                        <option value="sold_out">已售完</option>
                        <option value="discontinued">已停售</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>規格:</label>
                    <textarea id="productSpecifications" placeholder="例如: 寬5cm*高8cm / 模型光固化樹脂"></textarea>
                </div>
                <div class="form-group">
                    <label>預購取貨時間與地點:</label>
                    <textarea id="productPickupInfo" placeholder="例如: 2023/10月中 / Taipei Toy Festival台北國際玩具創作大展"></textarea>
                </div>
                <div class="form-group">
                    <label>預購按鈕顯示狀態:</label>
                    <select id="productPreorderButtonStatus">
                        <option value="select_style">請選擇款式/前往預購</option>
                        <option value="sold_out">已售完</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>顯示在product cell的開放狀態:</label>
                    <select id="productCellOpenStatus">
                        <option value="preparing">準備中</option>
                        <option value="open_for_preorder">開放預購中</option>
                        <option value="stopped_selling">已停止販售</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>顯示在product cell的餘量狀態:</label>
                    <select id="productCellRemainingStatus">
                        <option value="still_available">尚有餘量</option>
                        <option value="sold_out">已售完</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>主色選項:</label>
                    <div class="color-options">
                        ${generateColorCheckboxes("main", ["black", "white"])}
                    </div>
                </div>
                <div class="form-group">
                    <label>副色選項:</label>
                    <div class="color-options">
                        ${generateColorCheckboxes("sub", [
                          "red",
                          "blue",
                          "green",
                          "brown",
                        ])}
                    </div>
                </div>
                <div class="form-group">
                    <label>上傳商品縮圖(thumb):</label>
                    <input type="file" id="productThumbnail" accept="image/*">
                </div>
                <div class="form-group">
                    <label>上傳LightSlider圖片:</label>
                    <input type="file" id="productLightSliderImages" accept="image/*" multiple>
                </div>
                <div class="form-group">
                    <label>Sketchfab 嵌入程式碼:</label>
                    <textarea id="productSketchfabEmbedLink" placeholder="貼上 Sketchfab 的 embed 代碼，或貼上 /embed 連結"></textarea>
                </div>
                <div class="form-group">
                    <label>Sketchfab 背景圖片:</label>
                    <input type="file" id="productSketchfabBackground" accept="image/*">
                </div>
                <div class="form-group">
                    <label>商品介紹圖片:</label>
                    <input type="file" id="productIntroduction" accept="image/*">
                </div>
                <div class="form-group">
                    <label>預購注意事項圖片:</label>
                    <input type="file" id="productPreorderNotes" accept="image/*">
                </div>
                <div class="form-actions">
                    <button type="submit">新增商品</button>
                    <button type="button" onclick="loadProducts()">取消</button>
                </div>
            </form>
        </div>
    `;

  // 綁定表單提交事件
  document
    .getElementById("addProductForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await addProduct();
    });
}

// 新增商品
async function addProduct() {
  try {
    // 獲取選中的顏色
    const getSelectedColors = (prefix) => {
      const checkboxes = document.querySelectorAll(
        `input[name="${prefix}Colors"]:checked`
      );
      return Array.from(checkboxes).map((cb) => cb.value);
    };

    const formData = {
      product_id: document.getElementById("productId").value,
      name: document.getElementById("productName").value,
      price: parseInt(document.getElementById("productPrice").value),
      deposit: parseInt(document.getElementById("productDeposit").value),
      max_quantity: parseInt(
        document.getElementById("productMaxQuantity").value
      ),
      status: document.getElementById("productStatus").value,
      specifications: document.getElementById("productSpecifications").value,
      pickup_info: document.getElementById("productPickupInfo").value,
      preorder_button_status: document.getElementById(
        "productPreorderButtonStatus"
      ).value,
      cell_open_status: document.getElementById("productCellOpenStatus").value,
      cell_remaining_status: document.getElementById(
        "productCellRemainingStatus"
      ).value,
      sketchfab_embed_link: document.getElementById("productSketchfabEmbedLink")
        .value,
      main_colors: getSelectedColors("main"),
      sub_colors: getSelectedColors("sub"),
    };

    const thumbnailFile = document.getElementById("productThumbnail").files[0];
    if (thumbnailFile) {
      formData.thumbnail_path = thumbnailFile;
    }

    const lightsliderFiles = document.getElementById(
      "productLightSliderImages"
    ).files;
    if (lightsliderFiles.length > 0) {
      formData.lightslider_images = Array.from(lightsliderFiles);
    }

    const sketchfabBackgroundFile = document.getElementById(
      "productSketchfabBackground"
    ).files[0];
    if (sketchfabBackgroundFile) {
      formData.sketchfab_background = sketchfabBackgroundFile;
    }

    const introductionImg = document.getElementById("productIntroduction")
      .files?.[0];
    if (introductionImg) {
      formData.product_introduction = introductionImg;
    }

    const preorderNotesImg = document.getElementById("productPreorderNotes")
      .files?.[0];
    if (preorderNotesImg) {
      formData.preorder_notes = preorderNotesImg;
    }

    await API.createProduct(formData);
    alert("商品新增成功！");
    loadProducts();
  } catch (error) {
    handleAPIError(error, "新增商品失敗");
  }
}

// 編輯商品
async function editProduct(productId) {
  try {
    const response = await API.getProductById(productId);
    const product = response.product;

    // 從前台的 shopping.js 中獲取顏色選項
    const getFrontendColors = () => {
      const frontendColors = [
        "black",
        "white",
        "gray",
        "gold",
        "silver",
        "bronze",
        "red",
        "orange",
        "yellow",
        "blue",
        "green",
        "brown",
        "none",
      ];

      const colorNames = {
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

      return { colors: frontendColors, names: colorNames };
    };

    const { colors: availableColors, names: colorNames } = getFrontendColors();

    // 生成顏色選項的HTML，並預選現有的顏色
    const generateColorCheckboxes = (prefix, existingColors = []) => {
      return availableColors
        .map(
          (color) => `
                <label class="color-checkbox">
                    <input type="checkbox" name="${prefix}Colors" value="${color}" 
                           ${existingColors.includes(color) ? "checked" : ""}>
                    <span class="color-label">${colorNames[color]}</span>
                </label>
            `
        )
        .join("");
    };

    const container = document.getElementById("productsList");
    container.innerHTML = `
            <div class="product-form">
                <h3>編輯商品</h3>
                <form id="editProductForm">
                    <div class="form-group">
                        <label>商品ID:</label>
                        <input type="text" id="editProductId" value="${
                          product.product_id
                        }" readonly>
                    </div>
                    <div class="form-group">
                        <label>商品名稱:</label>
                        <input type="text" id="editProductName" value="${
                          product.name
                        }" required>
                    </div>
                    <div class="form-group">
                        <label>價格:</label>
                        <input type="number" id="editProductPrice" value="${
                          product.price
                        }" required>
                    </div>
                    <div class="form-group">
                        <label>訂金:</label>
                        <input type="number" id="editProductDeposit" value="${
                          product.deposit
                        }" required>
                    </div>
                    <div class="form-group">
                        <label>最大數量:</label>
                        <input type="number" id="editProductMaxQuantity" value="${
                          product.max_quantity
                        }">
                    </div>
                    <div class="form-group">
                        <label>狀態:</label>
                        <select id="editProductStatus">
                            <option value="available" ${
                              product.status === "available" ? "selected" : ""
                            }>可購買</option>
                            <option value="sold_out" ${
                              product.status === "sold_out" ? "selected" : ""
                            }>已售完</option>
                            <option value="discontinued" ${
                              product.status === "discontinued"
                                ? "selected"
                                : ""
                            }>已停售</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>規格:</label>
                        <textarea id="editProductSpecifications">${
                          product.specifications || ""
                        }</textarea>
                    </div>
                    <div class="form-group">
                        <label>預購取貨時間與地點:</label>
                        <textarea id="editProductPickupInfo">${
                          product.pickup_info || ""
                        }</textarea>
                    </div>
                    <div class="form-group">
                        <label>預購按鈕顯示狀態:</label>
                        <select id="editProductPreorderButtonStatus">
                            <option value="select_style" ${
                              product.preorder_button_status === "select_style"
                                ? "selected"
                                : ""
                            }>請選擇款式/前往預購</option>
                            <option value="sold_out" ${
                              product.preorder_button_status === "sold_out"
                                ? "selected"
                                : ""
                            }>已售完</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>顯示在product cell的開放狀態:</label>
                        <select id="editProductCellOpenStatus">
                            <option value="preparing" ${
                              product.cell_open_status === "preparing"
                                ? "selected"
                                : ""
                            }>準備中</option>
                            <option value="open_for_preorder" ${
                              product.cell_open_status === "open_for_preorder"
                                ? "selected"
                                : ""
                            }>開放預購中</option>
                            <option value="stopped_selling" ${
                              product.cell_open_status === "stopped_selling"
                                ? "selected"
                                : ""
                            }>已停止販售</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>顯示在product cell的餘量狀態:</label>
                        <select id="editProductCellRemainingStatus">
                            <option value="still_available" ${
                              product.cell_remaining_status ===
                              "still_available"
                                ? "selected"
                                : ""
                            }>尚有餘量</option>
                            <option value="sold_out" ${
                              product.cell_remaining_status === "sold_out"
                                ? "selected"
                                : ""
                            }>已售完</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>主色選項:</label>
                        <div class="color-options">
                            ${generateColorCheckboxes(
                              "main",
                              Array.isArray(product.main_colors)
                                ? product.main_colors
                                : []
                            )}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>副色選項:</label>
                        <div class="color-options">
                            ${generateColorCheckboxes(
                              "sub",
                              Array.isArray(product.sub_colors)
                                ? product.sub_colors
                                : []
                            )}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>上傳商品縮圖(thumb):</label>
                        <input type="file" id="editProductThumbnail" accept="image/*">
                        ${
                          product.thumbnail_path
                            ? `<div class="current-image">
                                <p>目前縮圖:</p>
                                <img src="${buildImageUrl(
                                  product.thumbnail_path
                                )}" alt="${
                                product.name
                              }" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin: 5px;">
                                <button type="button" onclick="deleteImage('thumbnail', '${
                                  product.product_id
                                }')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;">刪除</button>
                               </div>`
                            : "<p>目前無縮圖</p>"
                        }
                    </div>
                    <div class="form-group">
                        <label>上傳LightSlider圖片:</label>
                        <input type="file" id="editProductLightSliderImages" accept="image/*" multiple>
                        <div id="lightsliderPreviewContainer" style="margin-top: 10px;">
                            <p style="font-weight: bold; color: #666;">預設會被替換的圖片:</p>
                            <p style="font-size: 12px; color: #999; margin-top: 5px;">可以拖曳圖片來改變順序</p>
                            <div id="lightsliderPreviewImages" style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
                                <p style="color: #999;">目前無圖片</p>
                            </div>
                            <button type="button" id="deleteAllLightSliderBtn" onclick="deleteAllLightSliderPreview('${
                              product.product_id
                            }')" style="display: none; background: #ff8800; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-top: 10px;">刪除所有LightSlider圖片</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Sketchfab 嵌入程式碼:</label>
                        <textarea id="editProductSketchfabEmbedLink">${
                          product.sketchfab_embed_link || ""
                        }</textarea>
                    </div>
                    <div class="form-group">
                        <label>Sketchfab 背景圖片:</label>
                        <input type="file" id="editProductSketchfabBackground" accept="image/*">
                        ${
                          product.sketchfab_background
                            ? `<div class="current-image"><p>目前背景:</p><img src="${buildImageUrl(
                                product.sketchfab_background
                              )}" alt="sketchfab背景" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin: 5px;"><button type="button" onclick="deleteImage('sketchfab_background', '${
                                product.product_id
                              }')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;">刪除</button></div>`
                            : "<p>目前無背景</p>"
                        }
                    </div>
                    <div class="form-group">
                        <label>商品介紹圖片:</label>
                        <input type="file" id="editProductIntroduction" accept="image/*">
                        ${
                          product.product_introduction
                            ? `<div class=\"current-image\"><p>目前介紹圖:</p><img src="${buildImageUrl(
                                product.product_introduction
                              )}" alt="商品介紹" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin: 5px;"><button type=\"button\" onclick=\"deleteImage('product_introduction', '${
                                product.product_id
                              }')\" style=\"background: #ff4444; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;\">刪除</button></div>`
                            : "<p>目前無介紹圖</p>"
                        }
                    </div>
                    <div class="form-group">
                        <label>預購注意事項圖片:</label>
                        <input type="file" id="editProductPreorderNotes" accept="image/*">
                        ${
                          product.preorder_notes
                            ? `<div class=\"current-image\"><p>目前注意事項圖:</p><img src="${buildImageUrl(
                                product.preorder_notes
                              )}" alt="預購注意事項" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin: 5px;"><button type=\"button\" onclick=\"deleteImage('preorder_notes', '${
                                product.product_id
                              }')\" style=\"background: #ff4444; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;\">刪除</button></div>`
                            : "<p>目前無注意事項圖</p>"
                        }
                    </div>
                    <div class="form-actions">
                        <button type="submit">更新商品</button>
                        <button type="button" onclick="loadProducts()">取消</button>
                    </div>
                </form>
            </div>
        `;

    // 初始化 LightSlider 圖片狀態（用於預覽）
    // 存儲格式：{ type: 'existing' | 'new', data: string | File, index?: number }
    window.lightsliderImageState = (product.lightslider_images || []).map(
      (img, index) => ({
        type: "existing",
        data: img,
        originalIndex: index,
      })
    );

    // 初始化預覽
    updateLightSliderPreview(productId);

    // 綁定文件上傳事件
    const fileInput = document.getElementById("editProductLightSliderImages");
    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        files.forEach((file) => {
          window.lightsliderImageState.push({
            type: "new",
            data: file,
          });
        });
        updateLightSliderPreview(productId);
        // 清空文件輸入，允許重複選擇相同文件
        e.target.value = "";
      }
    });

    // 綁定表單提交事件
    document
      .getElementById("editProductForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await updateProduct(productId);
      });
  } catch (error) {
    handleAPIError(error, "載入商品資料失敗");
  }
}

// 更新 LightSlider 圖片預覽
function updateLightSliderPreview(productId) {
  const previewContainer = document.getElementById("lightsliderPreviewImages");
  const deleteAllBtn = document.getElementById("deleteAllLightSliderBtn");

  if (!previewContainer || !window.lightsliderImageState) {
    return;
  }

  // 清理之前創建的 Object URL（避免內存洩漏）
  if (window.lightsliderPreviewUrls) {
    window.lightsliderPreviewUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }
  window.lightsliderPreviewUrls = [];

  if (window.lightsliderImageState.length === 0) {
    previewContainer.innerHTML = '<p style="color: #999;">目前無圖片</p>';
    if (deleteAllBtn) deleteAllBtn.style.display = "none";
    return;
  }

  if (deleteAllBtn) deleteAllBtn.style.display = "block";

  previewContainer.innerHTML = window.lightsliderImageState
    .map((item, index) => {
      let imageSrc;
      if (item.type === "existing") {
        // 現有圖片：使用 URL
        imageSrc = buildImageUrl(item.data);
      } else {
        // 新上傳的圖片：使用 URL.createObjectURL 創建預覽
        imageSrc = URL.createObjectURL(item.data);
        window.lightsliderPreviewUrls.push(imageSrc);
      }

      return `
        <div class="lightslider-preview-item" draggable="true" data-index="${index}" 
             style="position: relative; display: inline-block; cursor: move; user-select: none;"
             ondragstart="handleDragStart(event, ${index})"
             ondragend="handleDragEnd(event)"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event, ${index}, '${productId}')"
             ondragenter="handleDragEnter(event)"
             ondragleave="handleDragLeave(event)">
          <img src="${imageSrc}" alt="LightSlider圖片${
        index + 1
      }" style="max-width: 150px; max-height: 150px; border: 1px solid #ccc; margin: 5px; pointer-events: none;">
          <div style="position: absolute; top: 5px; left: 5px; background: rgba(255, 255, 255, 0.6); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${
            index + 1
          }</div>
          <button type="button" onclick="removeLightSliderPreview(${index}, '${productId}')" style="position: absolute; top: -5px; right: -5px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10;">×</button>
        </div>
      `;
    })
    .join("");

  // 添加拖拽样式
  if (!document.getElementById("lightsliderDragStyles")) {
    const style = document.createElement("style");
    style.id = "lightsliderDragStyles";
    style.textContent = `
      .lightslider-preview-item.dragging {
        opacity: 0.5;
        transform: scale(0.95);
      }
      .lightslider-preview-item.drag-over {
        border: 2px dashed #007bff;
        background-color: rgba(0, 123, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
}

// 拖拽相關變量
let draggedIndex = null;

// 處理拖拽開始
function handleDragStart(event, index) {
  draggedIndex = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", event.target.outerHTML);
  event.currentTarget.classList.add("dragging");
}

// 處理拖拽結束
function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  // 移除所有 drag-over 樣式
  document.querySelectorAll(".lightslider-preview-item").forEach((item) => {
    item.classList.remove("drag-over");
  });
}

// 處理拖拽經過
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  return false;
}

// 處理拖拽進入
function handleDragEnter(event) {
  event.preventDefault();
  if (event.currentTarget.classList.contains("lightslider-preview-item")) {
    event.currentTarget.classList.add("drag-over");
  }
}

// 處理拖拽離開
function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

// 處理放置
function handleDrop(event, dropIndex, productId) {
  event.preventDefault();
  event.stopPropagation();

  if (draggedIndex === null || draggedIndex === dropIndex) {
    event.currentTarget.classList.remove("drag-over");
    return false;
  }

  // 重新排序數組：使用標準的數組移動方法
  if (window.lightsliderImageState && window.lightsliderImageState.length > 0) {
    const draggedItem = window.lightsliderImageState[draggedIndex];

    // 先移除被拖拽的項目
    window.lightsliderImageState.splice(draggedIndex, 1);

    // 計算插入位置
    // 如果從前面拖到後面，目標索引需要減1（因為已經移除了前面的項目）
    // 如果從後面拖到前面，目標索引保持不變
    const insertIndex = draggedIndex < dropIndex ? dropIndex : dropIndex + 1;

    // 插入到新位置
    window.lightsliderImageState.splice(insertIndex, 0, draggedItem);

    // 更新預覽
    updateLightSliderPreview(productId);
  }

  // 清理樣式
  event.currentTarget.classList.remove("drag-over");
  draggedIndex = null;
  return false;
}

// 移除單張 LightSlider 預覽圖片
function removeLightSliderPreview(index, productId) {
  if (!confirm("確定要移除這張圖片嗎？")) {
    return;
  }

  if (window.lightsliderImageState && window.lightsliderImageState[index]) {
    // 如果是新上傳的圖片，釋放對應的 Object URL
    if (
      window.lightsliderImageState[index].type === "new" &&
      window.lightsliderPreviewUrls
    ) {
      // 找到對應的 URL 並釋放
      const item = window.lightsliderImageState[index];
      // 由於我們在更新預覽時會重新創建所有 URL，這裡只需要從狀態中移除即可
      // URL 會在下次 updateLightSliderPreview 時被清理
    }

    window.lightsliderImageState.splice(index, 1);
    updateLightSliderPreview(productId);
  }
}

// 刪除所有 LightSlider 預覽圖片
function deleteAllLightSliderPreview(productId) {
  if (!confirm("確定要移除所有圖片嗎？")) {
    return;
  }

  // 清理所有 Object URL
  if (window.lightsliderPreviewUrls) {
    window.lightsliderPreviewUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    window.lightsliderPreviewUrls = [];
  }

  window.lightsliderImageState = [];
  updateLightSliderPreview(productId);
}

// 更新商品
async function updateProduct(productId) {
  try {
    // 獲取選中的顏色
    const getSelectedColors = (prefix) => {
      const checkboxes = document.querySelectorAll(
        `input[name="${prefix}Colors"]:checked`
      );
      return Array.from(checkboxes).map((cb) => cb.value);
    };

    const formData = {
      name: document.getElementById("editProductName").value,
      price: parseInt(document.getElementById("editProductPrice").value),
      deposit: parseInt(document.getElementById("editProductDeposit").value),
      max_quantity: parseInt(
        document.getElementById("editProductMaxQuantity").value
      ),
      status: document.getElementById("editProductStatus").value,
      specifications: document.getElementById("editProductSpecifications")
        .value,
      pickup_info: document.getElementById("editProductPickupInfo").value,
      preorder_button_status: document.getElementById(
        "editProductPreorderButtonStatus"
      ).value,
      cell_open_status: document.getElementById("editProductCellOpenStatus")
        .value,
      cell_remaining_status: document.getElementById(
        "editProductCellRemainingStatus"
      ).value,
      sketchfab_embed_link: document.getElementById(
        "editProductSketchfabEmbedLink"
      ).value,
      main_colors: getSelectedColors("main"),
      sub_colors: getSelectedColors("sub"),
    };

    const thumbnailFile = document.getElementById("editProductThumbnail")
      .files[0];
    if (thumbnailFile) {
      formData.thumbnail_path = thumbnailFile;
    }

    // 處理 LightSlider 圖片：使用預覽狀態中的圖片列表
    if (
      window.lightsliderImageState &&
      window.lightsliderImageState.length > 0
    ) {
      // 將狀態中的圖片轉換為數組：現有圖片保留路徑，新上傳的保留 File 對象
      formData.lightslider_images = window.lightsliderImageState.map(
        (item) => item.data
      );
    } else {
      // 如果預覽狀態為空，設置為空數組
      formData.lightslider_images = [];
    }

    const sketchfabBackgroundFile = document.getElementById(
      "editProductSketchfabBackground"
    ).files[0];
    if (sketchfabBackgroundFile) {
      formData.sketchfab_background = sketchfabBackgroundFile;
    }

    const editIntroImg = document.getElementById("editProductIntroduction")
      .files?.[0];
    if (editIntroImg) {
      formData.product_introduction = editIntroImg;
    }

    const editNotesImg = document.getElementById("editProductPreorderNotes")
      .files?.[0];
    if (editNotesImg) {
      formData.preorder_notes = editNotesImg;
    }

    await API.updateProduct(productId, formData);

    // 清理狀態和 Object URL
    if (window.lightsliderPreviewUrls) {
      window.lightsliderPreviewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      window.lightsliderPreviewUrls = null;
    }
    window.lightsliderImageState = null;

    alert("商品更新成功！");
    loadProducts();
  } catch (error) {
    handleAPIError(error, "更新商品失敗");
  }
}

// 刪除商品
async function deleteProduct(productId) {
  if (!confirm("確定要刪除這個商品嗎？此操作無法復原。")) {
    return;
  }

  try {
    await API.deleteProduct(productId);
    alert("商品刪除成功！");
    loadProducts();
  } catch (error) {
    handleAPIError(error, "刪除商品失敗");
  }
}

// 同步前端商品配置 (已移除，改為前台動態載入)
async function syncProductConfig() {
  alert(
    "前端現在會自動從後台載入商品配置，無需手動同步！\n\n前台會自動獲取最新的商品資料和顏色選項。"
  );
}

// 載入客戶列表
async function loadCustomers() {
  const container = document.getElementById("customersList");
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const phoneFilter = document.getElementById("customerPhoneFilter").value;
    const params = phoneFilter ? { phone: phoneFilter } : {};

    console.log("載入客戶，參數:", params);
    const data = await API.getCustomers(params);
    console.log("客戶資料回應:", data);

    if (!data || !data.customers) {
      console.error("API 回應格式錯誤:", data);
      container.innerHTML =
        '<div class="error">載入客戶資料失敗：回應格式錯誤</div>';
      return;
    }

    displayCustomers(data.customers);
  } catch (error) {
    console.error("載入客戶失敗:", error);
    handleAPIError(error, "載入客戶失敗");
    container.innerHTML = '<div class="error">載入客戶失敗</div>';
  }
}

// 顯示客戶列表
function displayCustomers(customers) {
  const container = document.getElementById("customersList");

  // 確保 customers 是陣列
  if (!Array.isArray(customers)) {
    console.error("customers 不是陣列:", customers);
    container.innerHTML =
      '<div class="error">載入客戶資料失敗：資料格式錯誤</div>';
    return;
  }

  if (customers.length === 0) {
    container.innerHTML = "<p>沒有找到客戶</p>";
    return;
  }

  const customersHTML = customers
    .map(
      (customer) => `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <strong>${customer.name}</strong><br>
                    <small>電話: ${customer.phone}</small>
                    ${
                      customer.email
                        ? `<br><small>信箱: ${customer.email}</small>`
                        : ""
                    }
                </div>
            </div>
            <div class="order-details">
                <p>註冊時間: ${formatDateTime(customer.created_at)}</p>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = customersHTML;
}

// 工具函數
function getStatusText(status) {
  const statusMap = {
    pending: "待處理",
    confirmed: "已確認",
    depositPaid: "已付訂金",
    fullPaid: "已付全款",
    shipped: "已出貨",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || status;
}

function getProductStatusText(status) {
  const statusMap = {
    available: "可購買",
    sold_out: "已售完",
    discontinued: "已停售",
  };
  return statusMap[status] || status;
}

function getPreorderButtonStatusText(status) {
  const statusMap = {
    select_style: "請選擇款式/前往預購",
    sold_out: "已售完",
  };
  return statusMap[status] || status;
}

function getCellOpenStatusText(status) {
  const statusMap = {
    preparing: "準備中",
    open_for_preorder: "開放預購中",
    stopped_selling: "已停止販售",
  };
  return statusMap[status] || status;
}

function getCellRemainingStatusText(status) {
  const statusMap = {
    still_available: "尚有餘量",
    sold_out: "已售完",
  };
  return statusMap[status] || status;
}

function getPickupMethodText(method) {
  const methodMap = {
    self_pickup: "自取",
    delivery: "宅配",
  };
  return methodMap[method] || method;
}

function getPaymentMethodText(method) {
  const methodMap = {
    credit_card: "信用卡",
    bank_transfer: "銀行轉帳",
  };
  return methodMap[method] || method;
}

function showError(message) {
  console.error(message);
  // 在頁面上顯示錯誤訊息
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  errorDiv.style.position = "fixed";
  errorDiv.style.top = "20px";
  errorDiv.style.right = "20px";
  errorDiv.style.zIndex = "1000";
  errorDiv.style.padding = "10px 20px";
  errorDiv.style.backgroundColor = "#f8d7da";
  errorDiv.style.color = "#721c24";
  errorDiv.style.border = "1px solid #f5c6cb";
  errorDiv.style.borderRadius = "5px";

  document.body.appendChild(errorDiv);

  // 3秒後自動移除
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 3000);
}

// 內部工具：動態載入 SweetAlert2
async function ensureSweetAlertLoaded() {
  if (window.Swal) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 內部工具：SweetAlert2 確認對話框
async function sweetConfirm({
  title = "確定嗎？",
  text = "此操作無法復原！",
  icon = "warning",
  confirmButtonText = "確認",
  cancelButtonText = "取消",
}) {
  await ensureSweetAlertLoaded();
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
  });
  return result.isConfirmed === true;
}

// 刪除單一訂單（SweetAlert 版）
async function deleteOrder(orderId, orderNumber) {
  const confirmed = await sweetConfirm({
    title: `刪除訂單 ${orderNumber}？`,
    text: "此操作無法復原！",
    icon: "warning",
    confirmButtonText: "確認",
    cancelButtonText: "取消",
  });

  if (!confirmed) return;

  try {
    console.log(`開始刪除訂單: ${orderId} (${orderNumber})`);

    const result = await API.request(`/api/orders/${orderId}`, {
      method: "DELETE",
    });
    console.log("刪除成功:", result);

    // 顯示成功訊息
    showSuccessToast(`訂單 ${orderNumber} 已成功刪除`);

    // 重新載入訂單列表
    loadOrders();
  } catch (error) {
    console.error("刪除訂單失敗:", error);
    alert(`刪除訂單失敗: ${error.message}`);
  }
}

// 批量刪除所有訂單 (危險操作)
async function deleteAllOrders() {
  // 第一次警告
  const confirmed = await sweetConfirm({
    title: "清空所有訂單？",
    text: "⚠️ 這將刪除所有訂單資料，此操作無法復原！",
    icon: "warning",
    confirmButtonText: "我了解，繼續",
    cancelButtonText: "取消",
  });

  if (!confirmed) return;

  // 第二次最終確認
  const doubleConfirmed = await sweetConfirm({
    title: "最後確認",
    text: "真的要清空所有訂單嗎？\n這包括：所有訂單記錄與明細（不可還原）",
    icon: "warning",
    confirmButtonText: "是，清空",
    cancelButtonText: "取消",
  });

  if (!doubleConfirmed) return;

  try {
    console.log("開始批量刪除所有訂單...");

    const result = await API.request("/api/orders/batch/all", {
      method: "DELETE",
      body: JSON.stringify({
        confirm: "DELETE_ALL_ORDERS",
      }),
    });
    console.log("批量刪除成功:", result);

    // 顯示成功訊息
    showSuccessToast(
      `已清空所有訂單 (${result.deletedOrders} 筆訂單，${result.deletedItems} 筆明細)`
    );

    // 重新載入訂單列表
    loadOrders();
  } catch (error) {
    console.error("批量刪除訂單失敗:", error);
    alert(`批量刪除失敗: ${error.message}`);
  }
}

// 顯示成功訊息
function showSuccessToast(message) {
  const toast = document.createElement("div");
  toast.className = "success-toast";
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// 刪除單張圖片
async function deleteImage(imageType, productId, imageIndex = null) {
  try {
    if (
      !confirm(
        `確定要刪除這張${
          imageType === "thumbnail" ? "縮圖" : "LightSlider圖片"
        }嗎？`
      )
    ) {
      return;
    }

    const response = await fetch(`/api/products/${productId}/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageType: imageType,
        imageIndex: imageIndex,
      }),
    });

    if (response.ok) {
      showSuccessToast("圖片刪除成功！");
      // 重新載入商品編輯表單
      await editProduct(productId);
    } else {
      const error = await response.json();
      throw new Error(error.message || "刪除圖片失敗");
    }
  } catch (error) {
    console.error("刪除圖片失敗:", error);
    alert("刪除圖片失敗: " + error.message);
  }
}

// 刪除所有LightSlider圖片
async function deleteAllImages(imageType, productId) {
  try {
    if (
      !confirm(
        `確定要刪除所有${
          imageType === "thumbnail" ? "縮圖" : "LightSlider圖片"
        }嗎？`
      )
    ) {
      return;
    }

    const response = await fetch(`/api/products/${productId}/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageType: imageType,
        deleteAll: true,
      }),
    });

    if (response.ok) {
      showSuccessToast("所有圖片刪除成功！");
      // 重新載入商品編輯表單
      await editProduct(productId);
    } else {
      const error = await response.json();
      throw new Error(error.message || "刪除圖片失敗");
    }
  } catch (error) {
    console.error("刪除圖片失敗:", error);
    alert("刪除圖片失敗: " + error.message);
  }
}

// 載入 Banner 管理界面
async function loadBannerManagement() {
  const container = document.getElementById("bannerManagement");
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const [bannerData, productSideData] = await Promise.all([
      API.getBanner(),
      API.getProductSide(),
    ]);
    displayBannerManagement(bannerData, productSideData);
  } catch (error) {
    handleAPIError(error, "載入設定失敗");
    container.innerHTML = '<div class="error">載入設定失敗</div>';
  }
}

// 顯示 Banner 管理界面
function displayBannerManagement(bannerData, productSideData) {
  const container = document.getElementById("bannerManagement");
  const bannerImage = bannerData.bannerImage || "";
  const bannerImagePath = bannerData.bannerImagePath || "";
  const productSideLink =
    productSideData?.productSideLink || "./product.html?id=product-Remain";
  const productSideImage = productSideData?.productSideImage || "";
  const productSideImagePath =
    productSideData?.productSideImagePath || "/images/shop/product-side.jpg";
  const productSideAlt = productSideData?.productSideAlt || "餘量釋出連結圖片";

  container.innerHTML = `
    <div class="product-form">
      <h3>Banner 圖片設定</h3>
      <form id="bannerForm">
        <div class="form-group">
          <label>目前 Banner 圖片:</label>
          ${
            bannerImage
              ? `<div class="current-image">
                  <img src="${bannerImage}" alt="Banner 圖片" style="max-width: 100%; max-height: 400px; border: 1px solid #ccc; margin: 10px 0;">
                  <p>圖片路徑: ${bannerImagePath}</p>
                </div>`
              : "<p>目前無 Banner 圖片</p>"
          }
        </div>
        <div class="form-group">
          <label>上傳新的 Banner 圖片:</label>
          <input type="file" id="bannerImageFile" accept="image/*">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            建議尺寸：寬度 1200px 以上，高度 300-600px
          </p>
        </div>
        <div class="form-group">
          <label>或輸入圖片路徑 (URL 或相對路徑):</label>
          <input type="text" id="bannerImagePath" value="${bannerImagePath}" placeholder="/images/shop/AD-banner.jpg">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            可以輸入完整的 URL (http://...) 或相對路徑 (/images/...)
          </p>
        </div>
        <div class="form-actions">
          <button type="submit">更新 Banner</button>
          <button type="button" onclick="loadBannerManagement()">取消</button>
        </div>
      </form>
    </div>

    <div class="product-form" style="margin-top: 30px;">
      <h3>Product-Side 設定</h3>
      <form id="productSideForm">
        <div class="form-group">
          <label>目前 Product-Side 圖片:</label>
          ${
            productSideImage
              ? `<div class="current-image" style="width:183px">
                  <img src="${productSideImage}" alt="${productSideAlt}" style="max-width: 100%; max-height: 400px; border: 1px solid #ccc; margin: 10px 0;">
                  <p>圖片路徑: ${productSideImagePath}</p>
                  <p>連結: ${productSideLink}</p>
                  <p>Alt 文本: ${productSideAlt}</p>
                </div>`
              : "<p>目前無 Product-Side 圖片</p>"
          }
        </div>
        <div class="form-group">
          <label>連結 URL:</label>
          <input type="text" id="productSideLink" value="${productSideLink}" placeholder="./product.html?id=product-Remain">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            例如: ./product.html?id=product-Remain 或完整的 URL
          </p>
        </div>
        <div class="form-group">
          <label>上傳新的 Product-Side 圖片:</label>
          <input type="file" id="productSideImageFile" accept="image/*">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            建議尺寸：寬度 400-600px，高度 300-500px
          </p>
        </div>
        <div class="form-group">
          <label>或輸入圖片路徑 (URL 或相對路徑):</label>
          <input type="text" id="productSideImagePath" value="${productSideImagePath}" placeholder="/images/shop/product-side.jpg">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            可以輸入完整的 URL (http://...) 或相對路徑 (/images/...)
          </p>
        </div>
        <div class="form-group">
          <label>圖片 Alt 文本:</label>
          <input type="text" id="productSideAlt" value="${productSideAlt}" placeholder="餘量釋出連結圖片">
          <p style="color: #666; font-size: 12px; margin-top: 5px;">
            用於圖片無法顯示時的替代文字
          </p>
        </div>
        <div class="form-actions">
          <button type="submit">更新 Product-Side</button>
          <button type="button" onclick="loadBannerManagement()">取消</button>
        </div>
      </form>
    </div>
  `;

  // 綁定表單提交事件
  document
    .getElementById("bannerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateBanner();
    });

  document
    .getElementById("productSideForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProductSide();
    });
}

// 更新 Banner
async function updateBanner() {
  try {
    const fileInput = document.getElementById("bannerImageFile");
    const pathInput = document.getElementById("bannerImagePath");
    let bannerImagePath = pathInput.value.trim();

    // 如果上傳了文件，先上傳到 S3
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      try {
        // 使用 S3 預簽名 URL 上傳
        const { uploadUrl, publicUrl } = await API.getPresignedUrl(
          file,
          "images/shop"
        );
        console.log("📤 上傳圖片到 S3:", { uploadUrl, publicUrl });
        await API.uploadToS3(uploadUrl, file);

        // 驗證圖片是否可以訪問
        try {
          const verifyResponse = await fetch(publicUrl, { method: "HEAD" });
          if (!verifyResponse.ok) {
            console.warn("⚠️ 圖片上傳成功但無法訪問:", publicUrl);
            console.warn(
              "⚠️ 響應狀態:",
              verifyResponse.status,
              verifyResponse.statusText
            );
            // 仍然繼續，因為可能是權限設置延遲
          } else {
            console.log("✅ 圖片上傳並驗證成功:", publicUrl);
          }
        } catch (verifyError) {
          console.warn("⚠️ 圖片驗證失敗（可能權限設置延遲）:", verifyError);
          // 仍然繼續，因為可能是權限設置延遲
        }

        bannerImagePath = publicUrl;
        showSuccessToast("圖片上傳成功！");
      } catch (error) {
        console.error("❌ 圖片上傳失敗:", error);
        alert("圖片上傳失敗: " + error.message);
        return;
      }
    }

    if (!bannerImagePath) {
      alert("請上傳圖片或輸入圖片路徑");
      return;
    }

    // 更新 banner 配置
    await API.updateBanner(bannerImagePath);
    showSuccessToast("Banner 更新成功！");
    loadBannerManagement();
  } catch (error) {
    handleAPIError(error, "更新 Banner 失敗");
  }
}

// 更新 Product-Side
async function updateProductSide() {
  try {
    const linkInput = document.getElementById("productSideLink");
    const fileInput = document.getElementById("productSideImageFile");
    const pathInput = document.getElementById("productSideImagePath");
    const altInput = document.getElementById("productSideAlt");

    const productSideLink = linkInput.value.trim();
    let productSideImagePath = pathInput.value.trim();
    const productSideAlt = altInput.value.trim() || "餘量釋出連結圖片";

    if (!productSideLink) {
      alert("請輸入連結 URL");
      return;
    }

    // 如果上傳了文件，先上傳到 S3
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      try {
        // 使用 S3 預簽名 URL 上傳
        const { uploadUrl, publicUrl } = await API.getPresignedUrl(
          file,
          "images/shop"
        );
        await API.uploadToS3(uploadUrl, file);
        productSideImagePath = publicUrl;
        showSuccessToast("圖片上傳成功！");
      } catch (error) {
        console.error("圖片上傳失敗:", error);
        alert("圖片上傳失敗: " + error.message);
        return;
      }
    }

    if (!productSideImagePath) {
      alert("請上傳圖片或輸入圖片路徑");
      return;
    }

    // 更新 product-side 配置
    await API.updateProductSide(
      productSideLink,
      productSideImagePath,
      productSideAlt
    );
    showSuccessToast("Product-Side 更新成功！");
    loadBannerManagement();
  } catch (error) {
    handleAPIError(error, "更新 Product-Side 失敗");
  }
}
