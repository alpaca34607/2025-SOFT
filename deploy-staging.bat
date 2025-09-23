@echo off
echo 🚀 部署到 Staging 環境...

echo 📋 檢查 Git 狀態...
git status

echo 🔄 切換到 staging 分支...
git checkout staging

echo 📦 拉取最新變更...
git pull origin staging

echo 🏗️ 安裝依賴...
cd backend
npm install

echo ✅ 準備完成！
echo 🌐 請前往部署平台進行部署：
echo    - Vercel: https://vercel.com
echo    - Railway: https://railway.app
echo    - Render: https://render.com

pause
