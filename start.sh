#!/bin/bash

echo "🚀 啟動軟筋生物預購系統..."

# 設定環境變數
export NODE_ENV=${NODE_ENV:-staging}
export PORT=${PORT:-3000}

# 確保必要的環境變數
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=staging
fi

if [ -z "$PORT" ]; then
  export PORT=3000
fi

echo "📋 環境配置:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"

# 建立必要的目錄
mkdir -p images/products logs

# 檢查圖片檔案
echo "🔍 檢查圖片檔案..."
if [ -d "images/products" ]; then
  echo "  - images/products 目錄存在"
  ls -la images/products/ | head -5
else
  echo "  - images/products 目錄不存在"
fi

if [ -d "images/shop" ]; then
  echo "  - images/shop 目錄存在"
  ls -la images/shop/ | head -5
else
  echo "  - images/shop 目錄不存在"
fi

# 啟動應用程式
echo "🏃 啟動後端服務..."
node backend/server.js
