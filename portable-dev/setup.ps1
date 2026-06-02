$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "=== ポータブル開発環境 自動セットアップ ===" -ForegroundColor Cyan

# ------------------------------------------------
# 1. Node.js 最新LTS バージョン取得＆ダウンロード
# ------------------------------------------------
Write-Host "`n[1/5] Node.js 最新LTSを確認中..." -ForegroundColor Yellow
$nodeIndex  = Invoke-RestMethod "https://nodejs.org/dist/index.json"
$latest     = $nodeIndex | Where-Object { $_.lts -ne $false } | Select-Object -First 1
$nodeVer    = $latest.version
$nodeUrl    = "https://nodejs.org/dist/$nodeVer/node-$nodeVer-win-x64.zip"
$nodeZip    = Join-Path $baseDir "node.zip"
$nodeDirName = "node-$nodeVer-win-x64"
$nodePath   = Join-Path $baseDir $nodeDirName

Write-Host "  Node.js $nodeVer をダウンロード中..."
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip -UseBasicParsing
Write-Host "  解凍中..."
Expand-Archive -Path $nodeZip -DestinationPath $baseDir -Force
Remove-Item $nodeZip
Write-Host "  完了" -ForegroundColor Green

# ------------------------------------------------
# 2. VS Code 最新版ダウンロード
# ------------------------------------------------
Write-Host "`n[2/5] VS Code 最新版をダウンロード中..." -ForegroundColor Yellow
$vscodeUrl  = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable"
$vscodeZip  = Join-Path $baseDir "vscode.zip"
$vscodeBaseName = "VSCode-win32-x64"
$vscodeDir  = Join-Path $baseDir $vscodeBaseName

if (Test-Path $vscodeDir) {
    Write-Host "  既存の VS Code フォルダをクリーンアップ中..."
    try {
        Remove-Item -Path $vscodeDir -Recurse -Force -ErrorAction Stop
    } catch {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $vscodeDir = Join-Path $baseDir ("$vscodeBaseName-$timestamp")
        Write-Host "  既存フォルダが使用中のため、別フォルダへ展開します: $vscodeDir" -ForegroundColor DarkYellow
    }
}

Invoke-WebRequest -Uri $vscodeUrl -OutFile $vscodeZip -UseBasicParsing
Write-Host "  解凍中..."
New-Item -ItemType Directory -Force -Path $vscodeDir | Out-Null
Expand-Archive -Path $vscodeZip -DestinationPath $vscodeDir
Remove-Item $vscodeZip
Write-Host "  完了" -ForegroundColor Green

# ------------------------------------------------
# 3. ポータブルモード有効化 ＋ settings.json生成
# ------------------------------------------------
Write-Host "`n[3/5] ポータブルモード設定中..." -ForegroundColor Yellow
$userDir = Join-Path $vscodeDir "data\user-data\User"
New-Item -ItemType Directory -Force -Path $userDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $vscodeDir "data\extensions") | Out-Null

$settings = @{
    "terminal.integrated.env.windows" = @{
        "PATH" = "`${env:PATH};$nodePath"
    }
    "editor.formatOnSave"       = $true
    "editor.tabSize"            = 2
    "editor.wordWrap"           = "on"
    "files.encoding"            = "utf8"
    "terminal.integrated.defaultProfile.windows" = "Command Prompt"
} | ConvertTo-Json -Depth 3

Set-Content -Path (Join-Path $userDir "settings.json") -Value $settings -Encoding UTF8
Write-Host "  完了" -ForegroundColor Green

# ------------------------------------------------
# 4. 拡張機能インストール
# ------------------------------------------------
Write-Host "`n[4/5] 拡張機能をインストール中..." -ForegroundColor Yellow
$codeExe       = Join-Path $vscodeDir "Code.exe"
$codeCli       = Join-Path $vscodeDir "bin\code.cmd"
$userDataDir   = Join-Path $vscodeDir "data\user-data"
$extDir        = Join-Path $vscodeDir "data\extensions"

$extensions = @(
    "MS-CEINTL.vscode-language-pack-ja",       # 日本語UI
    "DigitalBrainstem.javascript-ejs-support",  # EJS
    "dbaeumer.vscode-eslint",                   # ESLint
    "esbenp.prettier-vscode",                   # フォーマッター
    "christian-kohler.npm-intellisense",        # npm補完
    "christian-kohler.path-intellisense"        # パス補完
)

foreach ($ext in $extensions) {
    Write-Host "  $ext"
    if (Test-Path $codeCli) {
        & $codeCli --install-extension $ext --user-data-dir $userDataDir --extensions-dir $extDir --force | Out-Null
    } else {
        & $codeExe --install-extension $ext --user-data-dir $userDataDir --extensions-dir $extDir --force | Out-Null
    }
}
Write-Host "  完了" -ForegroundColor Green

# ------------------------------------------------
# 5. 起動用ショートカット（run.bat）生成
# ------------------------------------------------
Write-Host "`n[5/5] 起動バッチ生成中..." -ForegroundColor Yellow
$runBat = @"
@echo off
start "" "$codeExe"
"@
Set-Content -Path (Join-Path $baseDir "VSCode起動.bat") -Value $runBat -Encoding Default
Write-Host "  完了" -ForegroundColor Green

# ------------------------------------------------
# 完了サマリ
# ------------------------------------------------
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "セットアップ完了！" -ForegroundColor Green
Write-Host "Node.js  : $nodePath"
Write-Host "VS Code  : $vscodeDir"
Write-Host "起動     : VSCode起動.bat をダブルクリック"
Write-Host "========================================" -ForegroundColor Cyan
if ([Environment]::UserInteractive) {
    Read-Host 'Press Enter to exit' | Out-Null
}
