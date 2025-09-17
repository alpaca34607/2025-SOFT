const openNoticeBtn = document.getElementById('open-notice');
const closeNoticeBtn = document.getElementById('close-notice');
const noticePopup = document.getElementById('notice-popup');

// 開啟注意事項彈窗
openNoticeBtn.addEventListener('click', () => {
    noticePopup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
});

// 關閉注意事項彈窗
closeNoticeBtn.addEventListener('click', () => {
    noticePopup.style.display = 'none';
    document.body.style.overflow = '';
});

// 點擊外部關閉注意事項彈窗
window.addEventListener('click', (event) => {
    if (event.target === noticePopup) {
        noticePopup.style.display = 'none';
        document.body.style.overflow = '';
    }
});
      // 商品配置資料
      const PRODUCTS_CONFIG = {
        'product-SoftzillaOD': {
            name: '監修中 | 戶外風軟吉拉',
            price: 2500,
            deposit:300,
            maxQuantity: 3,
            mainColors: ['black', 'white'],
            subColors: ['brown', 'green']
        },
        'product-Softzilla': {
            name: '2023出品|軟吉拉公仔',
            price: 1500,
            deposit:300,
            maxQuantity: 3,
            mainColors: ['black', 'white'],
            subColors: ['gold', 'silver', 'red', 'orange', 'yellow', 'blue', 'green']
        },
        'product-Soft': {
            name: '2019出品 | 軟筋臥佛公仔',
            price: 1200,
            deposit:250,
            maxQuantity: 0,
            mainColors: ['white'],
            subColors: ['red', 'green', 'blue']
        },
        'product-Softtwice': {
            name: '2018出品 | 小貓仔黏土偶',
            price: 300,
            deposit:0,
            maxQuantity: 0,
            mainColors: ['white'],
            subColors: ['none']
        },
        'product-Remain': {
            name: '餘量釋出|軟吉拉公仔',
            price: 1000,
            deposit:150,
            maxQuantity: 3,
            mainColors: ['black', 'white'],
            subColors: [ 'red', 'blue', 'green']
        }
    };

    // 顏色名稱對照表
    const COLOR_NAMES = {
        'black': '黑色',
        'white': '白色',
        'gray': '灰色',
        'gold': '金色',
        'silver': '銀色',
        'bronze': '銅色',
        'red': '紅色',
        'orange': '橙色',
        'yellow': '黃色',
        'blue': '藍色',
        'green': '綠色',
        'brown':'棕色',
        'none':'無顏色選項',
    };

   // 根據 HTML 頁面上的 data-product-id 自動設定商品 ID
const CURRENT_PRODUCT_ID = document.body.dataset.productId; // 在 <body> 中設置 data-product-id

// 更新顏色選項
function updateColorOptions(productConfig) {
    const mainColorSelect = document.getElementById('mainColor');
    mainColorSelect.innerHTML = '<option value="">選擇主色</option>';
    productConfig.mainColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = COLOR_NAMES[color];
        mainColorSelect.appendChild(option);
    });

    const subColorSelect = document.getElementById('subColor');
    subColorSelect.innerHTML = '<option value="">選擇副色</option>';
    productConfig.subColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = COLOR_NAMES[color];
        subColorSelect.appendChild(option);
    });

    // 數量
    const quantitySelect = document.getElementById('quantity');
    quantitySelect.innerHTML = '';
    for (let i = 1; i <= productConfig.maxQuantity; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantitySelect.appendChild(option);
    }
}

// 初始化頁面
window.addEventListener('load', () => {
    const productConfig = PRODUCTS_CONFIG[CURRENT_PRODUCT_ID];
    if (!productConfig) {
        alert('找不到指定商品！');
        return;
    }

    document.getElementById('productName').textContent = productConfig.name;
    document.getElementById('unitPrice').textContent = productConfig.price;
    document.getElementById('unitDeposit').textContent = productConfig.deposit;

    updateColorOptions(productConfig);
    
    // 立即更新按鈕狀態
    updateCheckoutButton();

    const savedSelection = localStorage.getItem('productSelection');
    if (savedSelection) {
        const selection = JSON.parse(savedSelection);
        if (selection.productId === CURRENT_PRODUCT_ID) {
            document.getElementById('mainColor').value = selection.mainColor;
            document.getElementById('subColor').value = selection.subColor;
            document.getElementById('quantity').value = selection.quantity;
            document.getElementById('totalPrice').textContent = selection.totalPrice;
            document.getElementById('totalDeposit').textContent = selection.totalDeposit;
            // 再次更新按鈕狀態，以防 localStorage 中的選擇影響按鈕
            updateCheckoutButton();
        }
    }
});

// 按下結帳按鈕時檢查選擇
function updateCheckoutButton() {
    const checkoutButton = document.querySelector('.checkout button');
    const productConfig = PRODUCTS_CONFIG[CURRENT_PRODUCT_ID];
    
    // 先檢查是否已售完（maxQuantity 為 0）
    if (productConfig.maxQuantity === 0) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = '已售完';
        checkoutButton.classList.add('disabled');
        return;
    }
    
    // 再檢查顏色選擇
    const mainColor = document.getElementById('mainColor').value;
    const subColor = document.getElementById('subColor').value;
    
    if (!mainColor || !subColor) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = '請選擇款式';
        checkoutButton.classList.add('disabled');
    } else {
        checkoutButton.disabled = false;
        checkoutButton.textContent = '前往預購';
        checkoutButton.classList.remove('disabled');
    }

    
    // 檢查是否達到購買上限（maxQuantity 為 0）
    if (productConfig.maxQuantity === 0) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = '已售完';
        checkoutButton.classList.add('disabled');
        return;
    }
    
    // 檢查是否完成所有選擇
    if (!mainColor || !subColor) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = '請選擇款式';
        checkoutButton.classList.add('disabled');
    } else {
        checkoutButton.disabled = false;
        checkoutButton.textContent = '前往預購';
        checkoutButton.classList.remove('disabled');
    }
}

// 更新選擇並儲存到 localStorage
function updateSelection() {
    const productConfig = PRODUCTS_CONFIG[CURRENT_PRODUCT_ID];
    const mainColor = document.getElementById('mainColor').value;
    const subColor = document.getElementById('subColor').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;

    // 計算金額
    const totalPrice = productConfig.price * quantity;
    const totalDeposit = productConfig.deposit * quantity;

    // 更新顯示
    document.getElementById('unitPrice').textContent = productConfig.price;
    document.getElementById('unitDeposit').textContent = productConfig.deposit;
    document.getElementById('totalPrice').textContent = totalPrice;
    document.getElementById('totalDeposit').textContent = totalDeposit;

    // 儲存到 localStorage
    const selection = {
        productId: CURRENT_PRODUCT_ID,
        productName: productConfig.name,
        mainColor,
        subColor,
        quantity,
        unitPrice: productConfig.price,
        unitDeposit: productConfig.deposit,
        totalPrice,
        totalDeposit
    };
    localStorage.setItem('productSelection', JSON.stringify(selection));
    
    // 更新按鈕狀態
    updateCheckoutButton();
}


// 前往結帳頁面
function goToCheckout() {
    const mainColor = document.getElementById('mainColor').value;
    const subColor = document.getElementById('subColor').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const productConfig = PRODUCTS_CONFIG[CURRENT_PRODUCT_ID];

    // 驗證是否已選擇所有必要選項
    if (!mainColor || !subColor || !quantity) {
        alert('請完成所有選擇！');
        return;
    }

    // 確保商品還有庫存
    if (productConfig.maxQuantity === 0) {
        alert('很抱歉，此商品已售完！');
        return;
    }

    // 儲存完整的商品資訊到 localStorage
    const selection = {
        productId: CURRENT_PRODUCT_ID,
        productName: productConfig.name,
        mainColor,
        mainColorName: COLOR_NAMES[mainColor],
        subColor,
        subColorName: COLOR_NAMES[subColor],
        quantity,
        unitPrice: productConfig.price,
        unitDeposit: productConfig.deposit,
        totalPrice: productConfig.price * quantity,
        totalDeposit: productConfig.deposit * quantity,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('checkoutItems', JSON.stringify([selection]));
    
    // 導向到結帳頁面
    window.location.href = 'checkout.html';
}

// 監聽所有選擇的變更
['mainColor', 'subColor', 'quantity'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateSelection);
});

// 加到購物車

// 購物車相關功能
function initializeCart() {
    // 在 body 最後插入購物車 HTML
    const cartHTML = `
        <div id="cartPopup" class="cart-popup" style="display: none;">
            <div class="cart-content">
                <div class="cart-header">
                    <h2>購物車</h2>
                    <button onclick="toggleCart()" class="close-btn">&times;</button>
                </div>
                <div id="cartItems" class="cart-items">
                    <!-- 購物車項目將由 JavaScript 動態插入 -->
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <p>商品總額: NT$ <span id="cartTotalPrice">0</span></p>
                        <p>訂金總額: NT$ <span id="cartTotalDeposit">0</span></p>
                    </div>
                    <button onclick="cartCheckout()" class="checkout-btn" id="cartCheckoutBtn">前往預購</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', cartHTML);



    // 更新購物車數量
    updateCartCount();
}

function toggleCart() {
    const cartPopup = document.getElementById('cartPopup');
    if (!cartPopup.classList.contains('show')) {
        updateCartDisplay();
        cartPopup.style.display = 'block';
        // 使用 setTimeout確保display:block生效後再show
        setTimeout(() => {
            cartPopup.classList.add('show');
        }, 10);
    } else {
        cartPopup.classList.remove('show');
        // 等待過渡動畫完成後再隐藏元素
        setTimeout(() => {
            cartPopup.style.display = 'none';
        }, 300);
    }
}

//點擊外部關閉購物車
function initializeCartEvents() {
    const cartPopup = document.getElementById('cartPopup');
    cartPopup.addEventListener('click', (e) => {
        if (e.target === cartPopup) {
            toggleCart();
        }
    });
}

// 頁面加載完後進入事件
document.addEventListener('DOMContentLoaded', () => {
    initializeCart();
    initializeCartEvents();
});




function addToCart() {
    const mainColor = document.getElementById('mainColor').value;
    const subColor = document.getElementById('subColor').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const productConfig = PRODUCTS_CONFIG[CURRENT_PRODUCT_ID];

    // 驗證選擇
    if (!mainColor || !subColor || !quantity) {
        alert('請完成所有選擇！');
        return;
    }

    // 檢查商品是否可購買
    if (productConfig.maxQuantity === 0) {
        alert('很抱歉，此商品已售完！');
        return;
    }

    // 建立購物車項目
    const cartItem = {
        productId: CURRENT_PRODUCT_ID,
        productName: productConfig.name,
        mainColor,
        mainColorName: COLOR_NAMES[mainColor],
        subColor,
        subColorName: COLOR_NAMES[subColor],
        quantity,
        unitPrice: productConfig.price,
        unitDeposit: productConfig.deposit,
        totalPrice: productConfig.price * quantity,
        totalDeposit: productConfig.deposit * quantity
    };

    // 取得現有購物車項目
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // 檢查總數量是否超過3件
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0) + quantity;
    if (totalQuantity > 3) {
        alert('購物車商品總數不能超過3件');
        return;
    }

    // 加入購物車
    cartItems.push(cartItem);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    alert('已加入購物車！');
    updateCartCount();
    updateCartDisplay();
}

function removeFromCart(index) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cartItems.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
    updateCartDisplay();
}

function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalQuantity;
}

function updateCartDisplay() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartTotalDeposit = document.getElementById('cartTotalDeposit');

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">購物車是空的</p>';
        cartTotalPrice.textContent = '0';
        cartTotalDeposit.textContent = '0';
        return;
    }

    let totalPrice = 0;
    let totalDeposit = 0;

    cartItemsContainer.innerHTML = cartItems.map((item, index) => {
        totalPrice += item.totalPrice;
        totalDeposit += item.totalDeposit;
        return `
            <div class="cart-item">
                <div class="item-info">
                    <h3>${item.productName}</h3>
                    <p>主色: ${item.mainColorName} / 副色: ${item.subColorName}</p>
                    <p>數量: ${item.quantity}</p>
                    <p>小計: NT$ ${item.totalPrice}</p>
                    <p>訂金: NT$ ${item.totalDeposit}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="remove-btn">&times;</button>
            </div>
        `;
    }).join('');

    cartTotalPrice.textContent = totalPrice;
    cartTotalDeposit.textContent = totalDeposit;
}

function cartCheckout() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cartItems.length === 0) {
        alert('購物車是空的！');
        return;
    }
    
    if (cartItems.length > 3) {
        alert('購物車商品不能超過3件');
        return;
    }

    localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
    window.location.href = 'checkout.html';
}



// 購物紀錄

// 點擊外部關閉歷史清單
function initializeHistoryEvents() {
    const historyPopup = document.getElementById('historyPopup');
    if (!historyPopup) {
        console.warn('找不到歷史紀錄彈窗元素');
        return;
    }

    // 點擊外部關閉功能
    historyPopup.addEventListener('click', (e) => {
        if (e.target === historyPopup) {
            toggleHistoryPopup();
        }
    });
}

function toggleHistoryPopup() {
    const historyPopup = document.getElementById('historyPopup');
    if (!historyPopup) return;
    
    if (!historyPopup.classList.contains('show')) {
        // 先設置 display: block
        historyPopup.style.display = 'block';
        // 使用 requestAnimationFrame 確保 DOM 更新完成
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                historyPopup.classList.add('show');
            });
        });
    } else {
        historyPopup.classList.remove('show');
        // 等待過渡動畫完成後再隱藏元素
        setTimeout(() => {
            historyPopup.style.display = 'none';
        }, 300); // 與 CSS transition 時間一致
    }
}


//搜尋購買紀錄
function searchOrderHistory() {
    const phoneNumber = document.getElementById('searchPhoneNumber').value.trim();
    const historyRecords = document.getElementById('historyRecords');

    if (!phoneNumber) {
        alert('請輸入手機號碼');
        return;
    }

    const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || {};
    const orders = purchaseHistory[phoneNumber] || [];

    if (orders.length === 0) {
        historyRecords.innerHTML = '<p>查無訂單紀錄</p>';
        return;
    }

    historyRecords.innerHTML = orders.map(order => {
        try {
            // 訂單總覽資訊
            const orderOverview = `
                <div class="order-header">
                    <p class="order-date">訂單時間: ${new Date(order.orderDate).toLocaleString()}</p>
                    <p class="order-total">訂單總額: NT$ ${order.totalAmount}</p>
                    <p class="order-deposit">訂金總額: NT$ ${order.depositAmount}</p>
                </div>
            `;

            // 訂單商品詳情
            const orderItems = order.items.map(item => `
                <div class="history-item">
                    <h3>${item.productName}</h3>
                    <p>主色: ${item.mainColorName || COLOR_NAMES[item.mainColor]}</p>
                    <p>副色: ${item.subColorName || COLOR_NAMES[item.subColor]}</p>
                    <p>數量: ${item.quantity}</p>
                    <p>單價: NT$ ${item.unitPrice}</p>
                    <p>單件訂金: NT$ ${item.unitDeposit}</p>
                </div>
            `).join('');

            // 訂單客戶資訊
            const customerInfo = `
                <div class="customer-info">
                    <p>訂購人: ${order.customerInfo.name}</p>
                    <p>取貨方式: ${order.customerInfo.pickupMethod}</p>
                    <p>付款方式: ${order.customerInfo.paymentMethod}</p>
                </div>
            `;

            return `
                <div class="order-container">
                    ${orderOverview}
                    ${orderItems}
                    ${customerInfo}
                    <hr>
                </div>
            `;
        } catch (error) {
            console.error('訂單資料處理錯誤:', error);
            return '<div class="error-message">訂單資料顯示錯誤</div>';
        }
    }).join('');

    // 如果沒有成功顯示任何訂單，顯示錯誤訊息
    if (!historyRecords.innerHTML) {
        historyRecords.innerHTML = '<p>無法顯示訂單資料</p>';
    }
}

//按下 Enter 鍵也能搜尋的功能
document.getElementById('searchPhoneNumber')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchOrderHistory();
    }
});
document.addEventListener('DOMContentLoaded', initializeHistoryEvents);
