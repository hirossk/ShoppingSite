# CLAUDE.md

## プロジェクト概要
Spring BootのショッピングサイトをNode.js/Expressに変換するプロジェクト。
高校での体験授業で使用するため、**インストール不要・コピーだけで動く**構成が必須条件。

## 実行環境の制約（重要）
- 対象PC：高校のWindows PC（管理者権限なし、インストール不可）
- Node.jsは **zip展開版（embeddable）** をプロジェクト内の `node/` フォルダに同梱
- `node_modules/` も事前インストール済みのものをコピーで持ち込む
- 起動は `run.bat` のダブルクリックのみで完結すること

## 技術スタック
| 役割 | 使用技術 |
|------|----------|
| バックエンド | Node.js + Express |
| データベース | SQLite（**sql.js** を使用） |
| テンプレート | EJS（or 静的HTML + fetch） |
| 環境変数 | dotenv |

## sql.jsを使う理由
- `better-sqlite3` はネイティブビルドが必要なため対象環境では動かない可能性がある
- `sql.js` はPure JSのためビルド不要、コピーだけで動作する

## ディレクトリ構成
```
shop-app/
├── node/              # Node.js zip展開（同梱）
├── node_modules/      # 事前npm install済み
├── routes/            # Expressルーター（Spring Controllerに相当）
├── services/          # ビジネスロジック
├── db/                # SQLiteアクセス層（Spring Repositoryに相当）
├── views/             # EJSテンプレート（Thymeleafから変換）
├── public/            # 静的ファイル（CSS/JS/画像）
├── shop.db            # SQLiteデータベースファイル
├── app.js             # エントリーポイント
├── .env               # 環境変数
└── run.bat            # 起動スクリプト
```

## run.bat の内容
```bat
@echo off
.\node\node.exe app.js
pause
```

## Spring Boot → Node.js 変換方針
- `@RestController` → `express.Router()`
- `@GetMapping` / `@PostMapping` → `router.get()` / `router.post()`
- `@RequestBody` → `req.body`（express.json() ミドルウェア使用）
- `@PathVariable` → `req.params`
- `@RequestParam` → `req.query`
- Thymeleaf → EJS（変数展開の構文を変換）
- MyBatisのSQL → sql.jsのprepared statement
- `application.properties` → `.env`（dotenv）

## セッション管理
- Spring Securityの代替として `express-session` を使用
- ログイン状態は `req.session.user` で管理

## 注意事項
- sql.jsはDBをメモリにロードする仕様のため、**変更時は必ずファイルに書き戻す**こと
- ポート番号は `3000` を使用
- エラーハンドリングは授業用のためシンプルに保つ


