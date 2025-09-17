@echo off
echo ========================================
echo 軟筋生物預購系統 - 部署腳本
echo ========================================

echo.
echo 請選擇部署平台：
echo 1. Vercel (推薦 - 免費)
echo 2. Railway (全棧部署)
echo 3. Render (經濟實惠)
echo 4. 本地測試
echo.

set /p choice="請輸入選項 (1-4): "

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto render
if "%choice%"=="4" goto local
goto invalid

:vercel
echo.
echo ========================================
echo 部署到 Vercel
echo ========================================
echo.
echo 步驟：
echo 1. 確保專案已推送到 GitHub
echo 2. 前往 https://vercel.com
echo 3. 使用 GitHub 帳號登入
echo 4. 點擊 "New Project"
echo 5. 選擇您的 GitHub 倉庫
echo 6. 設定 Framework Preset: Other
echo 7. 點擊 "Deploy"
echo.
echo 部署完成後，您會獲得一個 .vercel.app 域名
echo.
pause
goto end

:railway
echo.
echo ========================================
echo 部署到 Railway
echo ========================================
echo.
echo 步驟：
echo 1. 確保專案已推送到 GitHub
echo 2. 前往 https://railway.app
echo 3. 使用 GitHub 帳號登入
echo 4. 點擊 "New Project"
echo 5. 選擇 "Deploy from GitHub repo"
echo 6. 選擇您的倉庫
echo 7. Railway 會自動部署
echo.
echo 部署完成後，您會獲得一個 .railway.app 域名
echo.
pause
goto end

:render
echo.
echo ========================================
echo 部署到 Render
echo ========================================
echo.
echo 步驟：
echo 1. 確保專案已推送到 GitHub
echo 2. 前往 https://render.com
echo 3. 註冊帳號
echo 4. 點擊 "New" → "Web Service"
echo 5. 連接 GitHub 倉庫
echo 6. 設定：
echo    - Name: soft-bio-backend
echo    - Environment: Node
echo    - Build Command: cd backend && npm install
echo    - Start Command: cd backend && npm start
echo 7. 點擊 "Create Web Service"
echo.
echo 部署完成後，您會獲得一個 .onrender.com 域名
echo.
pause
goto end

:local
echo.
echo ========================================
echo 本地測試
echo ========================================
echo.
echo 正在啟動本地伺服器...
echo.

cd backend
echo 安裝依賴套件...
npm install

echo.
echo 啟動伺服器...
echo 伺服器將在 http://localhost:3000 運行
echo 按 Ctrl+C 停止伺服器
echo.

npm start
goto end

:invalid
echo.
echo 無效選項，請重新執行腳本
echo.
pause

:end
echo.
echo 部署完成！
echo 如需詳細說明，請查看 DEPLOYMENT.md 檔案
echo.
pause 