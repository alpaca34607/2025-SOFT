#!/bin/bash

echo "🚀 啟動軟筋生物預購系統..."

# 設定環境變數
export NODE_ENV=${NODE_ENV:-staging}
# Railway 會自動設定 PORT 環境變數

echo "📋 環境配置:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: ${PORT:-未設定}"
echo "  - 工作目錄: $(pwd)"

# 直接啟動，不做複雜檢查
echo "🏃 啟動後端服務..."
exec node backend/server.js
