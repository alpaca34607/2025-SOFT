const { db } = require('./database');

async function getExistingColumns(table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table});`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((r) => r.name));
    });
  });
}

async function addColumnIfMissing(table, columnDef) {
  const [name, def] = columnDef.split(/\s+(.+)/);
  const columns = await getExistingColumns(table);
  if (!columns.includes(name)) {
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${def};`, [], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log(`✅ 已新增欄位 ${name}`);
  } else {
    console.log(`↪ 欄位已存在，略過：${name}`);
  }
}

async function run() {
  try {
    console.log('開始檢查/新增 products 欄位...');

    const columnsToEnsure = [
      'thumbnail_path TEXT',
      'lightslider_images TEXT',
      'sketchfab_embed_link TEXT',
      'sketchfab_background TEXT',
      'product_introduction TEXT',
      'preorder_notes TEXT',
      "preorder_button_status TEXT DEFAULT 'select_style'",
      "cell_open_status TEXT DEFAULT 'preparing'",
      "cell_remaining_status TEXT DEFAULT 'still_available'",
      'specifications TEXT',
      'pickup_info TEXT',
      'main_colors TEXT',
      'sub_colors TEXT'
    ];

    for (const col of columnsToEnsure) {
      await addColumnIfMissing('products', col);
    }

    // 設定預設值（僅在為 NULL 時）
    await new Promise((resolve, reject) => {
      db.run(`UPDATE products SET 
        preorder_button_status = COALESCE(preorder_button_status, 'select_style'),
        cell_open_status = COALESCE(cell_open_status, 'preparing'),
        cell_remaining_status = COALESCE(cell_remaining_status, 'still_available')
      ;`, [], (err) => (err ? reject(err) : resolve()));
    });

    console.log('✅ 欄位檢查/新增完成');
    process.exit(0);
  } catch (err) {
    console.error('❌ 欄位遷移失敗:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

