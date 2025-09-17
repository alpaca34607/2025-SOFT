const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, get, run } = require('../database-adapter');

const router = express.Router();

// 設定圖片上傳
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../images/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允許上傳圖片檔案'));
        }
    }
});

// 取得所有商品
router.get('/', async (req, res) => {
    try {
        const productResult = await query('SELECT * FROM products ORDER BY created_at DESC');
        const products = productResult.rows || [];
        
        // 解析 JSON 欄位
        products.forEach(product => {
            if (product.main_colors) {
                try {
                    product.main_colors = JSON.parse(product.main_colors);
                } catch (e) {
                    product.main_colors = [];
                }
            }
            if (product.sub_colors) {
                try {
                    product.sub_colors = JSON.parse(product.sub_colors);
                } catch (e) {
                    product.sub_colors = [];
                }
            }
        });
        
        res.json({ products });
    } catch (error) {
        console.error('取得商品失敗:', error);
        res.status(500).json({ error: '取得商品失敗', message: error.message });
    }
});

// 取得單一商品
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        // 解析 JSON 欄位
        if (product.main_colors) {
            try {
                product.main_colors = JSON.parse(product.main_colors);
            } catch (e) {
                product.main_colors = [];
            }
        }
        if (product.sub_colors) {
            try {
                product.sub_colors = JSON.parse(product.sub_colors);
            } catch (e) {
                product.sub_colors = [];
            }
        }
        
        res.json({ product });
    } catch (error) {
        console.error('取得商品失敗:', error);
        res.status(500).json({ error: '取得商品失敗', message: error.message });
    }
});

// 新增商品
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { 
            product_id, 
            name, 
            price, 
            deposit, 
            max_quantity, 
            status,
            description,
            main_colors,
            sub_colors
        } = req.body;
        
        if (!product_id || !name || price === undefined || deposit === undefined) {
            return res.status(400).json({ error: '缺少必要欄位' });
        }
        
        // 檢查商品 ID 是否已存在
        const existingProduct = await get('SELECT id FROM products WHERE product_id = ?', [product_id]);
        if (existingProduct) {
            return res.status(400).json({ error: '商品 ID 已存在' });
        }
        
        // 處理圖片路徑
        let imagePath = null;
        if (req.file) {
            imagePath = `/images/products/${req.file.filename}`;
        }
        
        // 處理顏色配置
        const mainColorsJson = main_colors || '[]';
        const subColorsJson = sub_colors || '[]';
        
        const result = await run(
            `INSERT INTO products (product_id, name, price, deposit, max_quantity, status, 
             description, main_colors, sub_colors, image_path) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product_id, name, price, deposit, max_quantity || 3, status || 'available', 
             description, mainColorsJson, subColorsJson, imagePath]
        );
        
        const product = await get('SELECT * FROM products WHERE id = ?', [result.id]);
        
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('新增商品失敗:', error);
        res.status(500).json({ error: '新增商品失敗', message: error.message });
    }
});

// 更新商品
router.put('/:id', upload.single('image'), async (req, res) => {
    try {

        const { id } = req.params;
        const { 
            name, 
            price, 
            deposit, 
            max_quantity, 
            status,
            description,
            main_colors,
            sub_colors
        } = req.body;
        
        // 檢查商品是否存在
        const existingProduct = await get('SELECT * FROM products WHERE product_id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        // 處理圖片路徑
        let imagePath = existingProduct.image_path;
        if (req.file) {
            // 刪除舊圖片
            if (existingProduct.image_path) {
                const oldImagePath = path.join(__dirname, '../..', existingProduct.image_path);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imagePath = `/images/products/${req.file.filename}`;
        }
        
        // 處理顏色配置
        const mainColorsJson = main_colors || existingProduct.main_colors;
        const subColorsJson = sub_colors || existingProduct.sub_colors;
        
        const result = await run(
            `UPDATE products SET name = ?, price = ?, deposit = ?, max_quantity = ?, 
             status = ?, description = ?, main_colors = ?, sub_colors = ?, 
             image_path = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE product_id = ?`,
            [name, price, deposit, max_quantity, status, description, 
             mainColorsJson, subColorsJson, imagePath, id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: '商品不存在或更新失敗' });
        }
        
        const updatedProduct = await get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        res.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error('更新商品失敗:', error);
        res.status(500).json({ error: '更新商品失敗', message: error.message });
    }
});

// 更新商品狀態和庫存
router.patch('/:id/stock', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const { max_quantity, status } = req.body;
        
        const result = await run(
            'UPDATE products SET max_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
            [max_quantity, status, id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        res.json({ success: true, message: '商品庫存更新成功' });
    } catch (error) {
        console.error('更新商品庫存失敗:', error);
        res.status(500).json({ error: '更新商品庫存失敗', message: error.message });
    }
});

// 刪除商品
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 取得商品資訊
        const product = await get('SELECT image_path FROM products WHERE product_id = ?', [id]);
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        // 刪除圖片檔案
        if (product.image_path) {
            const imagePath = path.join(__dirname, '../..', product.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        const result = await run('DELETE FROM products WHERE product_id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        res.json({ success: true, message: '商品刪除成功' });
    } catch (error) {
        console.error('刪除商品失敗:', error);
        res.status(500).json({ error: '刪除商品失敗', message: error.message });
    }
});

module.exports = router; 