-- PostgreSQL 資料庫 Schema
-- 用於生產環境的資料庫結構

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 產品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    preorder_button_status VARCHAR(50) DEFAULT 'select_style',
    cell_open_status VARCHAR(50) DEFAULT 'preparing',
    cell_remaining_status VARCHAR(50) DEFAULT 'still_available',
    specifications TEXT,
    pickup_info TEXT,
    thumbnail_path VARCHAR(500),
    lightslider_images JSONB,
    sketchfab_embed_link VARCHAR(1000),
    sketchfab_background VARCHAR(500),
    product_introduction VARCHAR(500),
    preorder_notes VARCHAR(500),
    main_colors JSONB,
    sub_colors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 客戶表
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    order_items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    payment_method VARCHAR(50),
    pickup_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 插入範例商品資料
INSERT INTO products (product_id, name, price, deposit, max_quantity, status, product_introduction, main_colors, sub_colors, thumbnail_path) 
VALUES 
('product-Soft', 'Soft 軟筋娃娃', 1200, 300, 3, 'available', '經典軟筋娃娃，柔軟可愛', '["white", "pink", "blue"]', '["red", "green", "yellow"]', '/images/gallery/soft-card.png'),
('product-Softtwice', 'Soft Twice 限定版', 1500, 400, 2, 'available', '限定版軟筋娃娃', '["black", "white"]', '["gold", "silver"]', '/images/gallery/sofman-card.png'),
('product-Softzilla', '軟吉拉', 2200, 500, 2, 'available', '大型軟筋怪獸', '["green", "blue", "black"]', '["yellow", "orange", "red"]', '/images/gallery/softzilla-card.png'),
('product-SoftzillaOD', '監修中 | 戶外風軟吉拉', 2500, 300, 3, 'available', '戶外風格軟吉拉', '["brown", "green"]', '["orange", "blue", "black"]', '/images/gallery/softzilla-camp.png'),
('product-Remain', '剩餘商品特價', 800, 200, 5, 'available', '剩餘庫存特價商品', '["mixed"]', '["various"]', '/images/gallery/bigcard.svg')
ON CONFLICT (product_id) DO NOTHING;

-- 注意：觸發器函數已移除，updated_at 欄位將在應用程式層面更新
