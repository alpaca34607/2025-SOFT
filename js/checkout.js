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

// 付款方式相關欄位控制
function handlePaymentMethodChange() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const creditCardFields = document.getElementById('creditCardFields');
    const qrcodeSection = document.getElementById('qrcodeSection');
    
    if (paymentMethod === 'creditCard') {
        creditCardFields.style.display = 'block';
        qrcodeSection.style.display = 'none';
    } else {
        creditCardFields.style.display = 'none';
        qrcodeSection.style.display = 'block';
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
function validateAndSubmitForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // 基本驗證
    if (!formData.get('name') || !formData.get('phone') || !formData.get('email')) {
        alert('請填寫必要欄位！');
        return;
    }

    // 儲存電話號碼到 localStorage
    const phoneNumber = formData.get('phone');
    let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || {};
    purchaseHistory[phoneNumber] = purchaseHistory[phoneNumber] || [];
    
    // 建立訂單資訊 - 現在包含所有商品
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

    // 送出訂單到後端
    alert('訂單已送出！');
    window.location.href = './Get-Soft.html';;
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
});