@echo off
chcp 65001 >nul
title Itown Discord Sunucusu (Cloudflare)
echo ========================================================
echo    🚀 ITOWN DISCORD - CLOUDFLARE İLE BAŞLATILIYOR...
echo ========================================================
echo.

:: 1. Sunucuyu arka planda başlat
start "Itown Backend" cmd /c "node server.js"

timeout /t 2 >nul

echo [1/2] Yerel Sunucu Başlatıldı (http://localhost:3001)
echo.
echo [2/2] Cloudflare Tüneli Başlatılıyor...
echo (Birkaç saniye içinde ekranda https://....trycloudflare.com linki çıkacak)
echo (O linki kopyalayıp kuzenlerinize ve arkadaşlarınıza atabilirsiniz!)
echo ========================================================
echo.

:: 2. Cloudflare tunnel'ı HTTP2 protokolü ve 127.0.0.1 ile sorunsuz başlat
npx cloudflared tunnel --protocol http2 --url http://127.0.0.1:3001
pause
