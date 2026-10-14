if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    "DATABASE_URL is required for the Prisma MySQL/TiDB database."
  );
}

const { prisma } = require("./prisma-client");

function normalizeValue(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (
    value &&
    typeof value === "object" &&
    value.constructor === Object
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        normalizeValue(entryValue),
      ])
    );
  }

  return value;
}

async function query(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  const normalizedRows = Array.isArray(rows)
    ? rows.map(normalizeValue)
    : [];

  return {
    rows: normalizedRows,
    rowCount: normalizedRows.length,
  };
}

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function run(sql, params = []) {
  const changes = await prisma.$executeRawUnsafe(sql, ...params);

  return {
    lastInsertRowid: undefined,
    rowCount: Number(changes),
    changes: Number(changes),
  };
}

async function setupDatabase() {
  await prisma.$queryRawUnsafe("SELECT 1");
  console.log("✅ Prisma MySQL/TiDB 連接測試成功");
  console.log("ℹ️ Prisma 不會在應用程式啟動時自動修改 schema，請先執行 prisma:db-push 或 prisma:migrate-deploy");
  return true;
}

async function closeDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  query,
  get,
  run,
  setupDatabase,
  closeDatabase,
};
