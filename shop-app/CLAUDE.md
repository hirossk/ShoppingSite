# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> リポジトリ全体（Spring Boot → Node.js 変換方針・実行環境の制約）は親フォルダの
> `../CLAUDE.md` を参照。本ファイルは `shop-app/`（実際に動く実装）に固有の内容。

## ⚠️ 最重要：これは「穴あき」の教材コードです

このアプリは高校の体験授業用の教材で、**コード中に意図的な未完成箇所（生徒の課題）が
埋め込まれています**。これらは**バグではなく課題**なので、頼まれない限り「修正」しないこと。

代表的な意図的ギャップ（`docs/worksheet.md` の Step に対応）:

| 場所 | 内容 | 課題 |
|------|------|------|
| `db/database.js` `purchase()` の `const newStock = item.stock;` | 在庫が減らない（正解は `item.stock - item.count`） | 4-B |
| `views/partials/product_card.ejs` の `'dummy'` | 画像・価格・在庫＋カートボタンの行き先(`addurl`)・`item.code`・色クラス(`btn-primary`) | 2,3-A〜C |
| `views/partials/cart_table.ejs` の `'dummy'` | 小計の計算 | 4-A |
| `views/partials/buy_button.ejs` の `'dummy'` | 購入ボタンの送信先(`buyurl`)・色クラス(`btn-danger`) | 4-C,4-D |
| `views/partials/item_detail.ejs` の `'dummy'` | 詳細ページの画像・値段・在庫＋行き先(`addurl`)・商品番号・色クラス | おかわりD-A〜D-F |
| `db/seed.js` の `______` / コメントアウトされた `INSERT` | 初期商品の追加 | 1-A |

注: カートボタン／購入ボタンの「行き先」は文字列のハードコードではなく `addurl`／`buyurl`
変数を書かせる穴埋め（ページごとに `/cart/add`↔`/shop/add`、`/purchase`↔`/buy` に切り替わる
共有パーツの仕組みを保つため）。色は `class="btn ___"` のクラス名を書かせる穴埋め。

画面に「dummy」やこわれた画像が出るのは正常。コードを触るときは、まず
`docs/worksheet.md`（生徒用）と `docs/補助シート_指導用.md` で**その箇所が課題かどうか**を確認する。

## 起動・DB リセット

ビルド・lint・テストは無い。Node.js と `node_modules/` は同梱（`node/`）。

- 通常起動: `run.bat` をダブルクリック → `node app.js` → http://localhost:3000
- 開発時の直接起動: `node/node.exe app.js`（または `npm start`）
- **DB を seed.js から作り直す**: `run_reset.bat`（= `app.js --initdb`）

**重要な落とし穴**: `db/seed.js` は **DB ファイルが存在しない初回のみ**読まれる。
`shop.db` が既にあると `seed.js` の変更は反映されない。seed を変えたら必ず `run_reset.bat`
（`--initdb`）で `shop.db` を削除して再作成する。フォーム（`/step1`）からの追加は即時反映。

## アーキテクチャ

リクエストの流れ: `app.js`（Express セットアップ）→ `routes/shop.js`（全ルート）→
`db/database.js`（sql.js データアクセス層）→ EJS（`views/`）。サービス層は無く、
ルーターが直接 db レイヤを呼ぶ。

**2系統のルートが同じ部品を共有している**のが中心的な設計:

- **学習用パス** `/step1`〜`/step5`, `/steps` — 授業で段階的に作る過程。
- **完成版の店** `/`, `/shop`, `/item/:code`, `/cart`, `/buy`, `/complete`。

両者は `views/partials/`（`product_card.ejs`, `cart_table.ejs`, `buy_button.ejs`, `order_table.ejs` など）を
**共有**する。だから生徒が Step で直した部品が、そのまま本番ページにも反映される
（worksheet の「自分が作った画面がお店で使われる」という体験はこの構造に依存）。
部品を編集するときは step ページと完成版ページの**両方**への影響を意識すること。

`product_card.ejs` は `addurl` 変数で「カートに入れる」リンク先を切り替える
（Step3 では `/cart/add`、本番ショップでは `/shop/add`）。同様に `buy_button.ejs`（購入ボタン）は
`buyurl` 変数で送信先を切り替える（Step4 では `/purchase`、本番カートでは `/buy`）。
`buy_button.ejs` は `step4.ejs` と `cart.ejs` の両方が `include` する共有パーツ。

`/list` `/cardlist` `/step6` `/about` は旧 URL 互換のリダイレクト（`routes/shop.js` 末尾）。

## sql.js のデータモデル（要注意）

`sql.js` は Pure JS（ネイティブビルド回避）で、**DB をメモリ上に展開**する。
そのため:

- **データを変更する操作（INSERT/UPDATE/DELETE）の後は必ず `saveDb()` を呼ぶ**こと。
  呼ばないと `shop.db` ファイルに書き戻されず変更が消える（`db/database.js` の各 mutation 関数参照）。
- `initDb()` は起動時に既存 DB へ `ALTER TABLE ... ADD COLUMN`（stock, description）を
  try/catch で実行し、古い `shop.db` を後方互換にマイグレーションする。

テーブルは `item`（code, name, price, image, stock, description）と
`cart`（code, count）の2つ。注文履歴テーブルは無く、直近の注文は
`req.session.lastOrder` に保持して `/complete`・`/step5` で表示する。

## 画像

商品画像は `public/images/<image>.png`。使えるファイル名は
`routes/shop.js` の `IMAGE_LIST` と `docs/worksheet.md` 末尾の一覧で管理されている
（`item.image` にはこの拡張子なしの名前を入れる）。新しい画像を足すときは両方を更新する。

## 文言・教材ドキュメント

- 生徒向け文言は日本語。コード内コメントも授業用の平易な日本語で書かれている。
- `docs/worksheet.md`（生徒用課題）、`docs/補助シート_指導用.md`（指導用）、
  `docs/用語ガイド_生徒用.md` がコードの課題と一対一で対応している。
  課題コードを変える際はこれらのドキュメントとの整合も確認する。
