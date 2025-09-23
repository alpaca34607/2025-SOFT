#!/bin/bash

echo "🚀 啟動軟筋生物預購系統..."

# 設定環境變數
export NODE_ENV=${NODE_ENV:-staging}
# Railway 會自動設定 PORT 環境變數

echo "📋 環境配置:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: ${PORT:-未設定}"
echo "  - 工作目錄: $(pwd)"

# 確保持久化存儲目錄存在 (Railway)
if [ "$NODE_ENV" = "staging" ] || [ -n "$RAILWAY_ENVIRONMENT" ]; then
  echo "📁 建立 Railway 持久化存儲目錄..."
  mkdir -p /data
  echo "✅ 持久化存儲目錄已準備"
fi

# 直接啟動，不做複雜檢查
echo "🏃 啟動後端服務..."
exec node backend/server.js
