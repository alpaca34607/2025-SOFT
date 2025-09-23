@echo off
echo 軟筋生物預購系統 - 手動端口設定
echo.

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 未找到 Node.js，請先安裝 Node.js
    echo 下載地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 進入後端目錄
cd backend

REM 檢查是否已安裝依賴
if not exist "node_modules" (
    echo 正在安裝依賴套件...
    npm install
    if %errorlevel% neq 0 (
        echo 錯誤: 依賴安裝失敗
        pause
        exit /b 1
    )
)

REM 手動設定端口
set /p PORT="請輸入要使用的端口 (預設 3000): "
if "%PORT%"=="" set PORT=3000

echo.
echo 使用端口: %PORT%
echo 啟動後端 API 伺服器...

REM 啟動後端伺服器
start "Soft Bio API - Port %PORT%" cmd /k "set PORT=%PORT% && npm run dev"

REM 等待伺服器啟動
timeout /t 3 /nobreak >nul

REM 開啟前端頁面
echo 開啟前端頁面...
start http://localhost:%PORT%

echo.
echo 系統已啟動！
echo 前端頁面: http://localhost:%PORT%
echo 管理後台: http://localhost:%PORT%/admin.html
echo API 文檔: http://localhost:%PORT%/api/health
echo.
echo 按任意鍵關閉此視窗...
pause >nul
