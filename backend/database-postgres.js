const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境變數配置
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// PostgreSQL 連接池
let pool = null;
let supabase = null;

// 初始化資料庫連接
function initializeDatabase() {
    if (DATABASE_URL) {
        // 使用 PostgreSQL 連接池
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        console.log('✅ PostgreSQL 連接池已初始化');
    }
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        // 初始化 Supabase 客戶端
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 客戶端已初始化');
    }
}

// 立即初始化資料庫連接
initializeDatabase();

// 執行 SQL 查詢
async function query(text, params = []) {
    if (!pool) {
        console.log('🔄 資料庫連接池尚未初始化，嘗試重新初始化...');
        initializeDatabase();
        
        if (!pool) {
            console.error('❌ 資料庫環境變數檢查:');
            console.error('  - DATABASE_URL:', DATABASE_URL ? '已設置' : '未設置');
            console.error('  - NODE_ENV:', process.env.NODE_ENV);
            throw new Error('資料庫連接未初始化 - 請檢查 DATABASE_URL 環境變數');
        }
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// 執行單一結果查詢（相當於 SQLite 的 get）
async function get(text, params = []) {
    const result = await query(text, params);
    return result.rows[0];
}

// 執行無回傳結果的查詢（相當於 SQLite 的 run）
async function run(text, params = []) {
    const result = await query(text, params);
    return result;
}

// 初始化資料庫表格
async function initDatabase() {
    try {
        console.log('🔄 開始初始化 PostgreSQL 資料庫表格...');
        
        // 讀取並執行 SQL schema
        const schemaPath = path.join(__dirname, '../database_schema_postgres.sql');
        let schema;
        
        try {
            schema = fs.readFileSync(schemaPath, 'utf8');
        } catch (error) {
            console.log('📄 PostgreSQL schema 檔案不存在，創建基本表格...');
            schema = await createPostgreSQLSchema();
        }
        
        // 分割 SQL 語句並執行
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await query(statement.trim());
            }
        }
        
        console.log('✅ PostgreSQL 資料庫表格初始化完成');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL 資料庫初始化失敗:', error.message);
        throw error;
    }
}

// 創建 PostgreSQL schema
async function createPostgreSQLSchema() {
    return `
-- 建立商品表格
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    deposit INTEGER NOT NULL,
    max_quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'available',
    description TEXT,
    main_colors TEXT,
    sub_colors TEXT,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立客戶表格
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立訂單表格
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    customer_address TEXT,
    total_amount INTEGER NOT NULL,
    deposit_amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立訂單項目表格
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    main_color VARCHAR(50),
    sub_color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設商品資料
INSERT INTO products (product_id, name, price, deposit, max_quantity, status, description, main_colors, sub_colors) 
VALUES 
('product-Soft', 'Soft 軟筋娃娃', 1200, 300, 3, 'available', '經典軟筋娃娃，柔軟可愛', '["white", "pink", "blue"]', '["red", "green", "yellow"]'),
('product-Softtwice', 'Soft Twice 限定版', 1500, 400, 2, 'available', '限定版軟筋娃娃', '["black", "white"]', '["gold", "silver"]'),
('product-Softzilla', '軟吉拉', 2200, 500, 2, 'available', '大型軟筋怪獸', '["green", "blue", "black"]', '["yellow", "orange", "red"]'),
('product-SoftzillaOD', '監修中 | 戶外風軟吉拉', 2500, 300, 3, 'available', '戶外風格軟吉拉', '["brown", "green"]', '["orange", "blue", "black"]'),
('product-Remain', '剩餘商品特價', 800, 200, 5, 'available', '剩餘庫存特價商品', '["mixed"]', '["various"]')
ON CONFLICT (product_id) DO NOTHING;

-- 建立索引提升效能
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
`;
}

// 設置資料庫
async function setupDatabase() {
    try {
        initializeDatabase();
        
        if (pool) {
            // 測試連接
            await query('SELECT NOW()');
            console.log('✅ PostgreSQL 連接測試成功');
            
            // 初始化表格
            await initDatabase();
            return true;
        } else {
            throw new Error('無法建立資料庫連接');
        }
    } catch (error) {
        console.error('❌ 資料庫設置失敗:', error);
        throw error;
    }
}

// 關閉資料庫連接
async function closeDatabase() {
    if (pool) {
        await pool.end();
        console.log('✅ PostgreSQL 連接池已關閉');
    }
}

module.exports = {
    query,
    get,
    run,
    setupDatabase,
    closeDatabase,
    pool: () => pool,
    supabase: () => supabase
};