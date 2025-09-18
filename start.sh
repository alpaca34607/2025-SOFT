#!/bin/bash

echo "🚀 啟動軟筋生物預購系統..."

# 設定環境變數
export NODE_ENV=${NODE_ENV:-staging}
export PORT=${PORT:-3000}

echo "📋 環境配置:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - 工作目錄: $(pwd)"

# 檢查檔案結構
echo "🔍 檢查檔案結構..."
ls -la
echo "📁 檢查 backend 目錄:"
ls -la backend/ || echo "❌ backend 目錄不存在"

# 檢查 server.js
if [ -f "backend/server.js" ]; then
  echo "✅ server.js 存在"
else
  echo "❌ server.js 不存在"
  exit 1
fi

# 啟動應用程式
echo "🏃 啟動後端服務..."
node backend/server.js
