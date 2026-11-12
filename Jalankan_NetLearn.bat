@echo off
title NetLearn - Server Lokal SMK Negeri 3 Makassar
color 0b
cls
echo ===============================================================================
echo            NETLEARN - PLATFORM PENGALAMATAN JARINGAN (IPv4)
echo                        SMK NEGERI 3 MAKASSAR
echo ===============================================================================
echo.
echo Menjalankan NetLearn melalui Server HTTP Lokal...
echo Hal ini memastikan seluruh pemutar video YouTube dapat langsung diputar
echo di dalam web tanpa kendala keamanan browser (Bebas Error 153).
echo.
echo Tekan Ctrl + C di jendela ini jika ingin menghentikan server.
echo ===============================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [STATUS] Menjalankan server lokal menggunakan Node.js (Port 3000)...
    start http://localhost:3000/index.html
    node server.js
    goto selesai
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [STATUS] Menjalankan server lokal menggunakan Python (Port 3000)...
    start http://localhost:3000/index.html
    python -m http.server 3000
    goto selesai
)

echo [PERINGATAN] Node.js atau Python tidak ditemukan di PATH.
echo Membuka aplikasi langsung via browser...
start index.html

:selesai
pause
