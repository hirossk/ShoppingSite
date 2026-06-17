@echo off
chcp 65001 > nul
echo ==========================================
echo  商品データを初期状態に作り直して起動します
echo  （db/seed.js の内容でデータベースをリセット）
echo ==========================================
.\node\node.exe app.js --initdb
pause
