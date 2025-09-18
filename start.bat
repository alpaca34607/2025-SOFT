@echo off
echo 啟動軟筋生物預購系統...
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

REM 檢查端口是否被占用
echo 檢查端口 3000 是否可用...
netstat -an | findstr ":3000 " >nul
if %errorlevel% equ 0 (
    echo 端口 3000 已被占用，嘗試使用端口 3001...
    set PORT=3001
    netstat -an | findstr ":3001 " >nul
    if %errorlevel% equ 0 (
        echo 端口 3001 也被占用，嘗試使用端口 3002...
        set PORT=3002
    )
) else (
    set PORT=3000
)

echo 使用端口: %PORT%

REM 啟動後端伺服器
echo 啟動後端 API 伺服器...
start "Soft Bio API" cmd /k "set PORT=%PORT% && npm run dev"

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