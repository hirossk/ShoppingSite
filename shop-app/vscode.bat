@echo off
rem このバッチがあるフォルダ（shop-app）をトップにしてVSCodeを開く
echo VSCode を起動しています...（初回は少し時間がかかります）
start "" "%~dp0vscode\Code.exe" "%~dp0"
