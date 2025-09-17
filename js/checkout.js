// 顏色名稱對照表 - 從 shopping.js 移植過來
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
    'brown': '棕色',
    'none': '無顏色選項',
};

// 從 localStorage 獲取商品選擇資訊
const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');

// 檢查 API 模組是否已載入
console.log('checkout.js 載入完成，檢查 API 模組:', {
    API: typeof API,
    checkAPIHealth: typeof checkAPIHealth,
    handleAPIError: typeof handleAPIError
});

// 付款方式相關欄位控制
function handlePaymentMethodChange() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const creditCardFields = document.getElementById('creditCardFields');
    const qrcodeSection = document.getElementById('qrcodeSection');
    
    // 隱藏所有 QR Code 容器
    const atmQrcode = document.getElementById('atmQrcode');
    const pxpayQrcode = document.getElementById('pxpayQrcode');
    const lnepayQrcode = document.getElementById('lnepayQrcode');
    
    // 隱藏信用卡欄位 (暫時停用)
    if (creditCardFields) {
        creditCardFields.style.display = 'none';
    }
    
    // 根據付款方式顯示對應的 QR Code
    if (paymentMethod === 'creditCard') {
        // 信用卡暫時停用
        qrcodeSection.style.display = 'none';
    } else {
        qrcodeSection.style.display = 'block';
        
        // 隱藏所有 QR Code
        atmQrcode.style.display = 'none';
        pxpayQrcode.style.display = 'none';
        lnepayQrcode.style.display = 'none';
        
        // 顯示對應的 QR Code
        switch (paymentMethod) {
            case 'atm':
                atmQrcode.style.display = 'block';
                break;
            case 'pxpay':
                pxpayQrcode.style.display = 'block';
                break;
            case 'lnepay':
                lnepayQrcode.style.display = 'block';
                break;
        }
    }
}

// 訂單摘要區域
function updateOrderSummary() {
    if (!checkoutItems || checkoutItems.length === 0) return;

    // 計算總金額和總訂金
    const totalAmount = checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalDeposit = checkoutItems.reduce((sum, item) => sum + item.totalDeposit, 0);

    // 商品資訊區塊
    document.getElementById('productSummary').innerHTML = `
        ${checkoutItems.map(item => `
            <div class="product-info">
                <div class="detail-area">
                    <div class="num-img-wrapper">
                        <p>${item.quantity}</p>
                        <img src="./images/shop/${item.productId}-thumb.jpg" alt="${item.productName}" />
                    </div>
                    <div class="details">
                        <h3>${item.productName}</h3>
                        <div class="color-detail">
                            <p>主色: ${item.mainColorName || COLOR_NAMES[item.mainColor]}</p>
                            <p>副色: ${item.subColorName || COLOR_NAMES[item.subColor]}</p>
                        </div>
                        <p class="per-price">單價 NT$ ${item.unitPrice}</p>
                    </div>
                </div>
            </div>
        `).join('')}
        <div class="grand-total">
            <div class="total-area">
                <h4 class="total">商品總額</h4>
                <p>NT$ ${totalAmount}</p>
            </div>
        </div>
    `;

    // 訂金資訊區塊
    document.getElementById('depositSummary').innerHTML = `
        ${checkoutItems.map(item => `
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
        `).join('')}
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
    if (!formData.get('name') || !formData.get('phone') || !formData.get('email')) {
        alert('請填寫必要欄位！');
        return;
    }

    // 檢查 API 連接 - 如果 API 模組未載入，直接使用 localStorage 模式
    console.log('🔍 檢查 API 模組...');
    console.log('checkAPIHealth 類型:', typeof checkAPIHealth);
    console.log('API 類型:', typeof API);
    
    if (typeof checkAPIHealth !== 'function') {
        console.log('❌ API 模組未載入，使用 localStorage 模式');
        submitToLocalStorage(formData);
        return;
    }
    
    console.log('✅ API 模組已載入，開始健康檢查...');
    try {
        const isAPIHealthy = await checkAPIHealth();
        console.log('健康檢查結果:', isAPIHealthy);
        if (!isAPIHealthy) {
            // 如果 API 無法連接，回退到 localStorage 模式
            console.warn('❌ API 無法連接，使用 localStorage 模式');
            submitToLocalStorage(formData);
            return;
        }
        console.log('✅ API 健康檢查通過');
    } catch (error) {
        console.warn('❌ API 健康檢查失敗，使用 localStorage 模式:', error);
        submitToLocalStorage(formData);
        return;
    }

    try {
        // 準備訂單資料
        const orderData = {
            customerInfo: {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            },
            items: checkoutItems,
            pickupMethod: formData.get('pickupMethod'),
            paymentMethod: formData.get('paymentMethod'),
            note: formData.get('note')
        };

        // 顯示載入狀態
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = '處理中...';
        submitButton.disabled = true;

        // 送出訂單到後端
        console.log('🔍 檢查 API 類別...');
        console.log('API 類型:', typeof API);
        console.log('API.createOrder 類型:', typeof API?.createOrder);
        
        if (typeof API === 'undefined' || typeof API.createOrder !== 'function') {
            console.log('❌ API 類別未定義，使用 localStorage 模式');
            submitToLocalStorage(formData);
            return;
        }
        
        console.log('✅ API 類別正常，開始提交訂單...');
        console.log('訂單資料:', orderData);
        
        try {
            console.log('🔄 正在提交訂單到後端...');
            const result = await API.createOrder(orderData);
            console.log('✅ 訂單提交成功:', result);
            
            // 清空購物車
            localStorage.removeItem('cartItems');
            localStorage.removeItem('checkoutItems');

            // 顯示成功訊息
            alert(`訂單建立成功！\n訂單編號: ${result.order.order_number}`);
            window.location.href = './Get-Soft.html';
            return;
        } catch (apiError) {
            console.warn('❌ API 提交失敗，使用 localStorage 模式:', apiError);
            console.error('詳細錯誤:', apiError);
            submitToLocalStorage(formData);
            return;
        }

    } catch (error) {
        console.error('表單提交過程中發生錯誤:', error);
        submitToLocalStorage(formData);
    }
}

// 回退到 localStorage 模式
function submitToLocalStorage(formData) {
    const phoneNumber = formData.get('phone');
    let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || {};
    purchaseHistory[phoneNumber] = purchaseHistory[phoneNumber] || [];
    
    // 建立訂單資訊
    const orderInfo = {
        orderDate: new Date().toISOString(),
        items: checkoutItems,
        customerInfo: {
            name: formData.get('name'),
            phone: phoneNumber,
            email: formData.get('email'),
            pickupMethod: formData.get('pickupMethod'),
            paymentMethod: formData.get('paymentMethod'),
            note: formData.get('note')
        },
        totalAmount: checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0),
        depositAmount: checkoutItems.reduce((sum, item) => sum + item.totalDeposit, 0)
    };

    // 將訂單加入購買歷史
    purchaseHistory[phoneNumber].push(orderInfo);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));

    // 清空購物車
    localStorage.removeItem('cartItems');
    localStorage.removeItem('checkoutItems');

    alert('訂單已送出！(離線模式)');
    window.location.href = './Get-Soft.html';
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    // 檢查是否有商品選擇
    if (!checkoutItems || checkoutItems.length === 0) {
        alert('未找到商品選擇資訊！');
        window.location.href = 'products.html';
        return;
    }

    // 初始化訂單摘要
    updateOrderSummary();

    // 設置付款方式變更監聽
    document.getElementById('paymentMethod').addEventListener('change', handlePaymentMethodChange);

    // 設置表單提交監聽
    document.getElementById('checkoutForm').addEventListener('submit', validateAndSubmitForm);
    
    // 初始化付款方式顯示 (預設為 ATM)
    handlePaymentMethodChange();
});