@echo off
chcp 65001 >nul
title LM Studio 镜像切换工具

echo ========================================
echo     LM Studio 镜像切换工具
echo     将 huggingface.co ^-^> hf-mirror.com
echo ========================================
echo.

:: 检测常见安装路径
set "DETECTED_PATH="
for %%p in (
    "D:\Game and Files\AI\LM Studio"
    "%LOCALAPPDATA%\Programs\LM Studio"
    "%PROGRAMFILES%\LM Studio"
    "%PROGRAMFILES(X86)%\LM Studio"
) do (
    if exist "%%~p\resources\app\.webpack\main\index.js" set "DETECTED_PATH=%%~p"
)

if defined DETECTED_PATH (
    echo 检测到 LM Studio 安装目录: %DETECTED_PATH%
    set /p USE_DETECTED=使用此路径？(Y/n):
) else (
    echo 未自动检测到 LM Studio 安装目录。
    set "USE_DETECTED=n"
)

if /i "%USE_DETECTED%"=="n" (
    set /p INSTALL_PATH=请输入 LM Studio 安装目录:
) else (
    set "INSTALL_PATH=%DETECTED_PATH%"
)

:: 验证路径
if not exist "%INSTALL_PATH%" (
    echo 错误: 路径不存在: %INSTALL_PATH%
    pause
    exit /b 1
)

set "MAIN_FILE=%INSTALL_PATH%\resources\app\.webpack\main\index.js"
set "RENDERER_FILE=%INSTALL_PATH%\resources\app\.webpack\renderer\main_window.js"

if not exist "%MAIN_FILE%" (
    echo 错误: 未找到 main/index.js
    echo 查找位置: %MAIN_FILE%
    pause
    exit /b 1
)
if not exist "%RENDERER_FILE%" (
    echo 错误: 未找到 main_window.js
    echo 查找位置: %RENDERER_FILE%
    pause
    exit /b 1
)

echo.
echo 处理中...

:: 使用 PowerShell 进行备份和替换（处理大文件更高效）
powershell -NoProfile -Command ^
    $main = '%MAIN_FILE%'; ^
    $renderer = '%RENDERER_FILE%'; ^
    $count = 0; ^
    ^
    if (!(Test-Path ($main + '.bak'))) { ^
        Copy-Item $main ($main + '.bak'); ^
        Write-Host '  ✓ 已备份 main/index.js.bak'; ^
    }; ^
    $c = (Get-Content $main -Raw) -replace 'https://huggingface\.co', 'https://hf-mirror.com'; ^
    $n = [regex]::Matches($c, 'hf-mirror\.com').Count; ^
    $c | Set-Content $main -NoNewline -Encoding UTF8; ^
    Write-Host ('  ✓ main/index.js 替换 ' + $n + ' 处'); ^
    $count += $n; ^
    ^
    if (!(Test-Path ($renderer + '.bak'))) { ^
        Copy-Item $renderer ($renderer + '.bak'); ^
        Write-Host '  ✓ 已备份 main_window.js.bak'; ^
    }; ^
    $c = (Get-Content $renderer -Raw) -replace 'https://huggingface\.co', 'https://hf-mirror.com'; ^
    $n = [regex]::Matches($c, 'hf-mirror\.com').Count; ^
    $c | Set-Content $renderer -NoNewline -Encoding UTF8; ^
    Write-Host ('  ✓ main_window.js 替换 ' + $n + ' 处'); ^
    $count += $n; ^
    Write-Host ('  ---'); ^
    Write-Host ('  ✅ 完成！共替换 ' + $count + ' 处'); ^
    ^
    if ($count -eq 0) { exit 1 } else { exit 0 }

if %errorlevel% neq 0 (
    echo.
    echo ⚠ 警告: 替换数为 0，文件可能已被修改过，请检查路径是否正确
)

echo.
echo 请重启 LM Studio 生效！
echo.
echo 如需还原，删除以下 .bak 后缀文件即可恢复:
echo   %MAIN_FILE%.bak
echo   %RENDERER_FILE%.bak
echo.
pause
