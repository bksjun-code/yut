@echo off
echo.
echo ===================================================
echo [전통 윷놀이 - Premium Edition] 3D 아이콘 복사 스크립트
echo ===================================================
echo.
echo 생성된 참신한 3D 아이콘들을 assets 폴더로 복사합니다...
echo.

copy "C:\Users\sunof\.gemini\antigravity\brain\3ccbab3a-cc9e-4e27-82e6-072f310b1054\pregnancy_icon_1779596023773.png" "assets\pregnancy_icon.png" >nul
if %errorlevel% equ 0 (
    echo [성공] 임신(새 알 부화) 아이콘 복사 완료! (assets\pregnancy_icon.png)
) else (
    echo [오류] 임신 아이콘 복사 실패. 경로를 확인해 주세요.
)

copy "C:\Users\sunof\.gemini\antigravity\brain\3ccbab3a-cc9e-4e27-82e6-072f310b1054\pongdang_icon_1779596043135.png" "assets\pongdang_icon.png" >nul
if %errorlevel% equ 0 (
    echo [성공] 퐁당(소용돌이 물살) 아이콘 복사 완료! (assets\pongdang_icon.png)
) else (
    echo [오류] 퐁당 아이콘 복사 실패. 경로를 확인해 주세요.
)

echo.
echo ===================================================
echo 복사가 완료되었습니다. 아무 키나 누르면 종료됩니다.
echo ===================================================
pause >nul
