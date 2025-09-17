-- 軟筋生物預購系統資料庫結構

-- 客戶資料表
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品資料表
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL,
    deposit INTEGER NOT NULL,
    max_quantity INTEGER DEFAULT 3,
    status TEXT CHECK(status IN ('available', 'sold_out', 'discontinued')) DEFAULT 'available',
    description TEXT,
    main_colors TEXT, -- JSON 格式儲存主色選項
    sub_colors TEXT, -- JSON 格式儲存副色選項
    image_path VARCHAR(500), -- 商品圖片路徑
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單主表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    deposit_amount INTEGER NOT NULL,
    pickup_method TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled')) DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 訂單明細表
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    main_color VARCHAR(50) NOT NULL,
    main_color_name VARCHAR(50) NOT NULL,
    sub_color VARCHAR(50) NOT NULL,
    sub_color_name VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    unit_deposit INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    total_deposit INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 建立索引
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 插入預設商品資料
INSERT INTO products (product_id, name, price, deposit, max_quantity, status, description, main_colors, sub_colors) VALUES
('product-SoftzillaOD', '監修中 | 戶外風軟吉拉', 2500, 300, 3, 'available', '戶外風格的軟吉拉公仔，適合戶外活動攜帶', '["black", "white"]', '["brown", "green"]'),
('product-Softzilla', '2023出品|軟吉拉公仔', 1500, 300, 3, 'available', '2023年最新出品的軟吉拉公仔，多種顏色可選', '["black", "white"]', '["gold", "silver", "red", "orange", "yellow", "blue", "green"]'),
('product-Soft', '2019出品 | 軟筋臥佛公仔', 1200, 250, 0, 'sold_out', '2019年出品的經典軟筋臥佛公仔，已售完', '["white"]', '["red", "green", "blue"]'),
('product-Softtwice', '2018出品 | 小貓仔黏土偶', 300, 0, 0, 'sold_out', '2018年出品的小貓仔黏土偶，已售完', '["white"]', '["none"]'),
('product-Remain', '餘量釋出|軟吉拉公仔', 1000, 150, 3, 'available', '餘量釋出的軟吉拉公仔，價格優惠', '["black", "white"]', '["red", "blue", "green"]'); 