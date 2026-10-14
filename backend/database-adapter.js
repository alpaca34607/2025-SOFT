// 資料庫適配器 - 統一 SQLite、PostgreSQL 和 Prisma MySQL/TiDB 的介面

const configuredProvider = (
  process.env.DATABASE_PROVIDER ||
  process.env.DB_PROVIDER ||
  ""
).toLowerCase();

const usePostgres =
  !["prisma", "mysql", "tidb"].includes(configuredProvider) &&
  (process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PGDATABASE ||
  process.env.RAILWAY_DATABASE_URL ||
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "staging" ||
  process.env.RAILWAY_ENVIRONMENT);

const usePrisma = ["prisma", "mysql", "tidb"].includes(configuredProvider);

console.log("🔍 資料庫配置檢查:");
console.log(
  "  - DATABASE_URL:",
  process.env.DATABASE_URL ? "已設置" : "未設置"
);
console.log(
  "  - POSTGRES_URL:",
  process.env.POSTGRES_URL ? "已設置" : "未設置"
);
console.log("  - PGDATABASE:", process.env.PGDATABASE ? "已設置" : "未設置");
console.log(
  "  - RAILWAY_DATABASE_URL:",
  process.env.RAILWAY_DATABASE_URL ? "已設置" : "未設置"
);
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log(
  "  - RAILWAY_ENVIRONMENT:",
  process.env.RAILWAY_ENVIRONMENT || "未設置"
);
console.log("  - DATABASE_PROVIDER:", configuredProvider || "自動");
console.log("  - 使用 Prisma MySQL/TiDB:", usePrisma);
console.log("  - 使用 PostgreSQL:", usePostgres);

let dbModule;
let usePostgresFinal = usePostgres;
let usePrismaFinal = usePrisma;

if (usePrisma) {
  console.log("📦 載入 Prisma MySQL/TiDB 模組...");
  try {
    dbModule = require("./database-prisma");
  } catch (error) {
    console.error("❌ Prisma 模組載入失敗:", error.message);
    throw error;
  }
} else if (usePostgres) {
  console.log("📦 載入 PostgreSQL 模組...");
  try {
    dbModule = require("./database-postgres");
    // 測試 PostgreSQL 連接是否可用
    if (
      !process.env.DATABASE_URL &&
      !process.env.POSTGRES_URL &&
      !process.env.PGDATABASE &&
      !process.env.RAILWAY_DATABASE_URL
    ) {
      console.log("⚠️  PostgreSQL 環境變數未設置，回退到 SQLite");
      dbModule = require("./database");
      usePostgresFinal = false;
    }
  } catch (error) {
    console.log("⚠️  PostgreSQL 模組載入失敗，回退到 SQLite:", error.message);
    dbModule = require("./database");
    usePostgresFinal = false;
    usePrismaFinal = false;
  }
} else {
  console.log("📦 載入 SQLite 模組...");
  dbModule = require("./database");
  usePrismaFinal = false;
}

// SQLite 風格的查詢適配器
async function query(sql, params = []) {
  // 確保資料庫已初始化
  if (!dbModule) {
    throw new Error("資料庫連接未初始化");
  }

  if (usePrismaFinal) {
    const result = await dbModule.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      lastInsertRowid: result.lastInsertRowid,
    };
  } else if (usePostgresFinal) {
    // PostgreSQL 使用 $1, $2, $3... 格式
    const pgSql = convertSQLiteToPostgreSQL(sql);
    const result = await dbModule.query(pgSql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      lastInsertRowid: result.rows[0]?.id, // PostgreSQL 返回 id
    };
  } else {
    // SQLite 原始查詢
    return new Promise((resolve, reject) => {
      const db = dbModule.db;
      const sqlLower = sql.toLowerCase().trim();

      // 需要使用 db.run 的操作：INSERT, UPDATE, DELETE
      if (
        sqlLower.startsWith("insert") ||
        sqlLower.startsWith("update") ||
        sqlLower.startsWith("delete")
      ) {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else
            resolve({
              rows: [],
              rowCount: this.changes,
              lastInsertRowid: this.lastID,
            });
        });
      } else {
        // 查詢操作使用 db.all
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else
            resolve({
              rows: rows || [],
              rowCount: rows ? rows.length : 0,
            });
        });
      }
    });
  }
}

// 獲取單一記錄
async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

// 執行更新/插入
async function run(sql, params = []) {
  const result = await query(sql, params);
  return {
    lastID: result.lastInsertRowid,
    changes: result.rowCount,
  };
}

// 將 SQLite SQL 轉換為 PostgreSQL SQL
function convertSQLiteToPostgreSQL(sql) {
  let pgSql = sql;

  // 替換參數佔位符 ? 為 $1, $2, $3...
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  // 處理 AUTOINCREMENT -> SERIAL (這個已在 schema 中處理)
  // 處理 INTEGER -> INTEGER (相容)
  // 處理 TEXT -> TEXT (相容)

  // 處理 RETURNING 子句（PostgreSQL 特有）
  if (
    pgSql.toLowerCase().includes("insert") &&
    !pgSql.toLowerCase().includes("returning")
  ) {
    pgSql = pgSql.replace(/;?\s*$/, " RETURNING id;");
  }

  return pgSql;
}

// 資料庫設置
async function setupDatabase() {
  return await dbModule.setupDatabase();
}

// 獲取原始資料庫實例（用於特殊操作）
function getDatabase() {
  if (usePrismaFinal) {
    return dbModule.prisma;
  } else if (usePostgresFinal) {
    return dbModule.pool();
  } else {
    return dbModule.getDatabase ? dbModule.getDatabase() : null;
  }
}

module.exports = {
  query,
  get,
  run,
  setupDatabase,
  getDatabase,
  usePostgres: usePostgresFinal,
  usePrisma: usePrismaFinal,
};
