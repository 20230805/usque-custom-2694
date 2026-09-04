@echo off
chcp 65001 >nul
title Usque MASQUE Pro v6.7 - Workers Deploy
echo ==========================================
echo  Usque MASQUE Pro v6.7 - Workers 部署
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有找到 Node.js。
  echo 请先安装 Node.js LTS：https://nodejs.org/
  pause
  exit /b 1
)

echo [1/3] 安装 / 更新 Wrangler...
call npm install
if errorlevel 1 (
  echo [错误] npm install 失败。
  pause
  exit /b 1
)

echo.
echo [2/3] 登录 Cloudflare...
call npx wrangler login
if errorlevel 1 (
  echo [错误] Cloudflare 登录失败。
  pause
  exit /b 1
)

echo.
echo [3/3] 部署 Worker + 静态资源...
call npx wrangler deploy
if errorlevel 1 (
  echo [错误] 部署失败，请查看上方 Wrangler 日志。
  pause
  exit /b 1
)

echo.
echo ==========================================
echo  部署完成
echo  请打开 Wrangler 输出的 *.workers.dev 地址。
echo  再测试 /api/health
echo ==========================================
pause
