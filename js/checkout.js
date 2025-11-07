// COLOR_NAMES 現在在 shop-menu.js 中定義

// 從 localStorage 獲取商品選擇資訊
const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems") || "[]");

// 檢查 API 模組是否已載入
console.log("checkout.js 載入完成，檢查 API 模組:", {
  API: typeof API,
  checkAPIHealth: typeof checkAPIHealth,
  handleAPIError: typeof handleAPIError,
});

// 付款方式相關欄位控制
function handlePaymentMethodChange() {
  const paymentMethod = document.getElementById("paymentMethod").value;
  const creditCardFields = document.getElementById("creditCardFields");
  const qrcodeSection = document.getElementById("qrcodeSection");

  // 隱藏所有 QR Code 容器
  const atmQrcode = document.getElementById("atmQrcode");
  const pxpayQrcode = document.getElementById("pxpayQrcode");
  const lnepayQrcode = document.getElementById("lnepayQrcode");

  // 隱藏信用卡欄位 (暫時停用)
  if (creditCardFields) {
    creditCardFields.style.display = "none";
  }

  // 根據付款方式顯示對應的 QR Code
  if (paymentMethod === "creditCard") {
    // 信用卡暫時停用
    qrcodeSection.style.display = "none";
  } else {
    qrcodeSection.style.display = "block";

    // 隱藏所有 QR Code
    atmQrcode.style.display = "none";
    pxpayQrcode.style.display = "none";
    lnepayQrcode.style.display = "none";

    // 顯示對應的 QR Code
    switch (paymentMethod) {
      case "atm":
        atmQrcode.style.display = "block";
        break;
      case "pxpay":
        pxpayQrcode.style.display = "block";
        break;
      case "lnepay":
        lnepayQrcode.style.display = "block";
        break;
    }
  }
}

// 訂單摘要區域
function updateOrderSummary() {
  if (!checkoutItems || checkoutItems.length === 0) return;

  // 計算總金額和總訂金
  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + parseFloat(item.totalPrice || 0),
    0
  );
  const totalDeposit = checkoutItems.reduce(
    (sum, item) => sum + parseFloat(item.totalDeposit || 0),
    0
  );

  // 商品資訊區塊
  document.getElementById("productSummary").innerHTML = `
        ${checkoutItems
          .map(
            (item) => `
            <div class="product-info">
                <div class="detail-area">
                    <div class="num-img-wrapper">
                        <p>${item.quantity}</p>
                        <img src="./images/shop/${
                          item.productId
                        }-thumb.jpg" alt="${item.productName}" />
                    </div>
                    <div class="details">
                        <h3>${item.productName}</h3>
                        <div class="color-detail">
                            <p>主色: ${
                              item.mainColorName || COLOR_NAMES[item.mainColor]
                            }</p>
                            <p>副色: ${
                              item.subColorName || COLOR_NAMES[item.subColor]
                            }</p>
                        </div>
                        <p class="per-price">單價 NT$ ${item.unitPrice}</p>
                    </div>
                </div>
            </div>
        `
          )
          .join("")}
        <div class="grand-total">
            <div class="total-area">
                <h4 class="total">商品總額</h4>
                <p>NT$ ${totalAmount}</p>
            </div>
        </div>
    `;

  // 訂金資訊區塊
  document.getElementById("depositSummary").innerHTML = `
        ${checkoutItems
          .map(
            (item) => `
            <div class="deposit-info">
                <div class="detail-area">
                    <div class="num-img-wrapper">
                        <p>${item.quantity}</p>
                        <img src="images/shop/${item.productId}-thumb.jpg" alt="${item.productName}" />
                    </div>
                    <div class="details">
                        <h3>${item.productName}</h3>
                        <p class="per-price">單件訂金 NT$ ${item.unitDeposit}</p>
                    </div>
                </div>
            </div>
        `
          )
          .join("")}
        <div class="grand-total">
            <div class="total-area">
                <h4 class="total">訂金總額</h4>
                <p>NT$ ${totalDeposit}</p>
            </div>
        </div>
    `;
}

// 表單驗證提交
async function validateAndSubmitForm(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // 基本驗證
  if (
    !formData.get("name") ||
    !formData.get("phone") ||
    !formData.get("email")
  ) {
    Swal.fire({
      icon: "warning",
      title: "請填寫必要欄位",
      text: "請填寫姓名、手機號碼和電子郵件",
      confirmButtonText: "確定",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  // 檢查 API 模組是否可用
  if (typeof API === "undefined" || typeof API.createOrder !== "function") {
    Swal.fire({
      icon: "error",
      title: "系統服務暫時無法使用",
      text: "請稍後再試或聯繫客服！",
      confirmButtonText: "確定",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  try {
    // 準備訂單資料
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

    // 顯示載入狀態
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "處理中...";
    submitButton.disabled = true;

    console.log("🔄 正在提交訂單到後端...");
    console.log("訂單資料:", orderData);

    const result = await API.createOrder(orderData);
    console.log("✅ 訂單提交成功:", result);

    // 清空購物車
    localStorage.removeItem("cartItems");
    localStorage.removeItem("checkoutItems");

    // 恢復按鈕狀態
    submitButton.textContent = originalText;
    submitButton.disabled = false;

    // 顯示成功訊息
    Swal.fire({
      icon: "success",
      title: "訂單建立成功！",
      html: `訂單編號: <strong>${result.order.order_number}</strong>`,
      confirmButtonText: "確定",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      window.location.href = "./Get-Soft.html";
    });
  } catch (error) {
    console.error("表單提交過程中發生錯誤:", error);

    // 恢復按鈕狀態
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = "送出預購單";
      submitButton.disabled = false;
    }

    // 顯示具體的錯誤訊息
    let errorMessage = "表單提交失敗";
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    Swal.fire({
      icon: "error",
      title: "表單提交失敗",
      html: `${errorMessage}<br>請稍後再試或聯繫客服！`,
      confirmButtonText: "確定",
      confirmButtonColor: "#3085d6",
    });
  }
}

// 回退到 localStorage 模式
function submitToLocalStorage(formData) {
  const phoneNumber = formData.get("phone");
  let purchaseHistory =
    JSON.parse(localStorage.getItem("purchaseHistory")) || {};
  purchaseHistory[phoneNumber] = purchaseHistory[phoneNumber] || [];

  // 建立訂單資訊
  const orderInfo = {
    orderDate: new Date().toISOString(),
    items: checkoutItems,
    customerInfo: {
      name: formData.get("name"),
      phone: phoneNumber,
      email: formData.get("email"),
      pickupMethod: formData.get("pickupMethod"),
      paymentMethod: formData.get("paymentMethod"),
      note: formData.get("note"),
    },
    totalAmount: checkoutItems.reduce(
      (sum, item) => sum + parseFloat(item.totalPrice || 0),
      0
    ),
    depositAmount: checkoutItems.reduce(
      (sum, item) => sum + parseFloat(item.totalDeposit || 0),
      0
    ),
  };

  // 將訂單加入購買歷史
  purchaseHistory[phoneNumber].push(orderInfo);
  localStorage.setItem("purchaseHistory", JSON.stringify(purchaseHistory));

  // 清空購物車
  localStorage.removeItem("cartItems");
  localStorage.removeItem("checkoutItems");

  Swal.fire({
    icon: "error",
    title: "表單提交失敗",
    text: "請稍後再試或聯繫客服！",
    confirmButtonText: "確定",
    confirmButtonColor: "#3085d6",
  });
  // 不跳轉頁面，讓用戶可以重試
}

// 頁面載入時初始化
document.addEventListener("DOMContentLoaded", () => {
  // 檢查是否有商品選擇
  if (!checkoutItems || checkoutItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "未找到商品選擇資訊",
      text: "請先選擇商品",
      confirmButtonText: "確定",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      window.location.href = "Get-Soft.html";
    });
    return;
  }

  // 初始化訂單摘要
  updateOrderSummary();

  // 設置付款方式變更監聽
  document
    .getElementById("paymentMethod")
    .addEventListener("change", handlePaymentMethodChange);

  // 設置表單提交監聽
  document
    .getElementById("checkoutForm")
    .addEventListener("submit", validateAndSubmitForm);

  // 初始化付款方式顯示 (預設為 ATM)
  handlePaymentMethodChange();
});
