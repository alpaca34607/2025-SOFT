// 添加 site_config 表用于存储网站配置（如 banner 图片）
const { query, run, usePostgres } = require("./database-adapter");

async function addSiteConfigTable() {
  try {
    console.log("🔄 开始创建 site_config 表...");

    // 检查表是否已存在
    let tableExists = false;
    if (usePostgres) {
      const checkTable = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'site_config'
        ) as exists
      `);
      tableExists = checkTable.rows && checkTable.rows[0]?.exists;
    } else {
      // SQLite 检查表是否存在
      const checkTable = await query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='site_config'
      `);
      tableExists = checkTable.rows && checkTable.rows.length > 0;
    }

    if (tableExists) {
      console.log("✅ site_config 表已存在，跳过创建");
      return;
    }

    // 根据数据库类型创建表
    if (usePostgres) {
      // PostgreSQL 语法
      await run(`
        CREATE TABLE IF NOT EXISTS site_config (
          id SERIAL PRIMARY KEY,
          config_key VARCHAR(100) UNIQUE NOT NULL,
          config_value TEXT,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      // SQLite 语法
      await run(`
        CREATE TABLE IF NOT EXISTS site_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          config_key VARCHAR(100) UNIQUE NOT NULL,
          config_value TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 创建索引
    await run(`
      CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key)
    `);

    // 插入默认配置
    const defaultConfigs = [
      {
        key: "banner_image",
        value: "/images/shop/AD-banner.jpg",
        description: "Get-Soft.html 页面的 banner 图片路径",
      },
      {
        key: "product_side_link",
        value: "./product.html?id=product-Remain",
        description: "Get-Soft.html 页面的 product-side 链接",
      },
      {
        key: "product_side_image",
        value: "/images/shop/product-side.jpg",
        description: "Get-Soft.html 页面的 product-side 图片路径",
      },
      {
        key: "product_side_alt",
        value: "餘量釋出連結圖片",
        description: "Get-Soft.html 页面的 product-side 图片 alt 文本",
      },
    ];

    for (const config of defaultConfigs) {
      if (usePostgres) {
        await run(
          `
          INSERT INTO site_config (config_key, config_value, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (config_key) DO NOTHING
        `,
          [config.key, config.value, config.description]
        );
      } else {
        // SQLite 使用 INSERT OR IGNORE
        await run(
          `
          INSERT OR IGNORE INTO site_config (config_key, config_value, description)
          VALUES (?, ?, ?)
        `,
          [config.key, config.value, config.description]
        );
      }
    }

    console.log("✅ site_config 表创建成功");
  } catch (error) {
    console.error("❌ 创建 site_config 表失败:", error);
    throw error;
  }
}

module.exports = { addSiteConfigTable };

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  addSiteConfigTable()
    .then(() => {
      console.log("✅ 迁移完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 迁移失败:", error);
      process.exit(1);
    });
}
