# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> リポジトリ全体の前提（Spring Boot → Node.js 変換方針・**インストール不要／コピーだけで動く**
> 実行環境の制約・sql.js を使う理由）は親フォルダの `../CLAUDE.md` を参照。
> 本ファイルは `shop-app/`（実際に動く実装）に固有の内容。

## このブランチ（`ishs_regi`）は「学校祭レジ（POS）」

元は高校の体験授業用の「穴あき教材ショッピングサイト」だったが、この `ishs_regi`
ブランチでは**学校祭で実際に販売するためのレジ（POS）アプリに作り替えてある**。
本番でお金を扱う用途。

- 見た目は**わざと元のショッピングサイト風のまま**（🛒翔陽ストアのブランド・Bootstrap カード・
  ダークなナビ・`石狩翔陽高校生が作るWebサイト` のフッター）。「授業で自分たちが作った雰囲気を
  学校祭で活かす」というユーザー意図なので、**この“自作した風”の見た目を勝手に作り替えない**こと。
- `main` ブランチは教材版のまま。教材の穴埋め課題・Step1〜5・`docs/worksheet.md` は
  **このブランチでは無効**（後述の「残骸」参照）。

## 起動・DB リセット

ビルド・lint・テストは無い。Node.js と `node_modules/` は同梱（`node/`）。

- 通常起動: `run.bat` をダブルクリック → `node app.js` → http://localhost:3000
- 直接起動: `node/node.exe app.js`（または `npm start`）。ポートは `.env` の `PORT`（既定 3000）。
- **DB を作り直す**: `run_reset.bat`（= `app.js --initdb`）。`shop.db` を削除して空スキーマで再作成する。

**落とし穴**: `db/seed.js`（= `insertSeedData`）は **DB ファイルが存在しない初回のみ**実行される。
このブランチでは seed は**意図的に空**（商品は `/kanri` 画面から登録する運用）。スキーマを変えたら
必ず `run_reset.bat` で作り直すこと。`shop.db` は git 管理外。

## アーキテクチャ

リクエストの流れ: `app.js`（Express セットアップ）→ `routes/shop.js`（全ルート）→
`db/database.js`（sql.js データアクセス層）→ EJS（`views/`）。サービス層は無く、
ルーターが直接 db レイヤを呼ぶ。

3つの画面（ナビは `views/partials/header.ejs`）:

| URL | 画面 | 主なルート |
|-----|------|-----------|
| `/` | レジ会計（メイン） | `regi.ejs` / `POST /regi/add\|inc\|dec\|remove\|clear` / `POST /regi/checkout` → `GET /regi/done`（`regi_done.ejs`） |
| `/shukei` | 売上集計 | `shukei.ejs` / `POST /shukei/reset`（売上記録だけ消す。商品・在庫は残す）。`GET /shukei/rireki`（`shukei_rireki.ejs`）= 会計ごとの履歴（時刻・単価・個数まで） |
| `/kanri` | 商品・在庫管理 | `kanri.ejs` / `POST /kanri/add\|update\|delete` / `POST /kanri/price`（値段だけ変更）/ `POST /kanri/stock/add\|set` / `POST /kanri/move`（並び順を1つ前後）/ `POST /kanri/settings`（レジのボタン設定） |

会計結果（おつり）は `req.session.lastSale` に入れて `/regi/done` で表示する（注文履歴の永続表示はしない）。

## レジのボタン設定（カスタマイズ）

`settings` テーブル（キー＝値）に保存し、`getSettings()` が `SETTINGS_DEFAULTS` で穴埋めして数値で返す。
`/kanri` の「レジのボタン設定」フォーム → `POST /kanri/settings` → `saveSettings()`（`INSERT OR REPLACE`）。
キーは `quick1/quick2/quick3`（クイック入金額）・`cols`（商品ボタンの列数 row-cols-md）・`btn_height`（ボタン高 px）。
`regi.ejs` がこれを読んでテンキー横のクイック入金ボタン・商品ボタンのレイアウトに反映する。
商品の並び順は `item.sort_order`（`findAllItems` は `ORDER BY sort_order, code`）。`moveItem(code,dir)` が
全行の sort_order を 0..n に振り直す。商品ボタンの色は商品ごと（`item.color`）で、`/kanri` のパレット＋
`<input type=color>` カラーピッカー（自由色）で設定。**会計ボタンは商品未選択（合計0円）だと押せない**
（`regi.ejs` の `render()` が `payBtn.disabled`／サーバも `checkout` がカゴ空を弾く＝二重ガード）。

## レジ会計の要点

- **カゴ = `cart` テーブル**＝「いま会計中のお客さん1人ぶん」。商品ボタンを押すと `addToCart` が
  1個ずつ積む。`addToCart` は**在庫を超えて積まない**ガードを持つ。
- 入金テンキーは **`regi.ejs` 末尾の素の JavaScript**（Bootstrap 非依存）。マウス（画面のボタン・
  「ちょうど」「+500/1000/5000」）でもキーボード（数字／Backspace／Esc=クリア／**Enter=会計**）でも
  入力でき、おつり・不足額をリアルタイム計算する。`paid` は hidden input で `POST /regi/checkout` に送る。
- `checkout(paid)` が **在庫減算 ＋ `sale`/`sale_line` への記録 ＋ カゴ削除**をまとめて行う。
  `paid < total` や在庫不足は失敗を返し `/?error=...` にリダイレクトする。

## sql.js のデータモデル（要注意）

`sql.js` は Pure JS で **DB をメモリ上に展開**する。**INSERT/UPDATE/DELETE の後は必ず `saveDb()` を呼ぶ**
（`db/database.js` の各 mutation 関数参照）。呼ばないと `shop.db` に書き戻されず変更が消える。
`initDb()` は既存 DB に対して `ALTER TABLE item ADD COLUMN color/stock/image/sort_order` と
`sale`/`sale_line`/`settings` の `CREATE TABLE IF NOT EXISTS` を行い、古い `shop.db` を後方互換にマイグレーションする。

テーブルは5つ:
- `item`（code, name, price, **stock**, **color**, **image**, **sort_order**）— color はレジ商品ボタンの背景色
  （パレットの選択肢は `routes/shop.js` の `COLORS`。実際はカラーピッカーで任意の #rrggbb も可）。
  image は商品画像の**配信パス**（例 `/images/item-xxx.png`、未設定なら空文字で色タイル表示にフォールバック）。
  sort_order はレジ／管理の表示順（`moveItem` で振り直す）。
- `cart`（code, count）— 会計中のカゴ。
- `sale`（id, created_at, total, paid, change）— 会計1回ぶん。
- `sale_line`（sale_id, code, name, price, count）— 明細。**集計は sale_line を `name` でGROUP BY**して出す（`getSalesSummary`）。履歴詳細は `getSalesHistory`（sale に lines をぶら下げる）。
- `settings`（key, value）— レジのボタン設定（クイック入金額・列数・ボタン高）。`getSettings`/`saveSettings`。

## 残骸（このブランチでは未使用）

`views/system/*.ejs`（shop/cart/step1〜5 等）と `views/partials/`（product_card / cart_table /
buy_button / item_detail / order_table）は**教材版ショップの名残で、現在のルートからは参照されていない**。
レジの画面は `views/regi.ejs` `regi_done.ejs` `shukei.ejs` `kanri.ejs`。改修時にこれら system/partials を
本番ページと混同しないこと（消すかどうかは未決＝勝手に消さない）。

## 画像・文言・オフライン

- レジ商品は**画像（任意）＋色タイル**で表示。画像があれば 70×70 のサムネ、無ければ従来どおり色タイル。
- **画像の登録は `/kanri`**：ファイルを選ぶと**ブラウザ側の canvas が 70×70 に縮小**して data URL を hidden
  input に入れて送信する。サーバー（`routes/shop.js` の `saveImageFromDataUrl`）がそれを
  `public/images/item-<時刻>-<乱数>.png` として**実ファイル保存**し、DB の `item.image` にはパスだけ入れる。
  商品の更新で画像差し替え／「画像を消す」、商品削除のときは `deleteItemImage` が**`item-` 接頭辞のファイルだけ**
  後始末する（教材版の `bag.png` 等は消さない）。multer 等は使わず**依存追加ゼロ**。
- `public/images/` の `item-*` 以外（`bag.png` など多数）は教材版ショップの名残。
- UI 文言・コードコメントは授業由来の平易な日本語。
- Bootstrap **CSS はローカル同梱**（`public/css/styles.css`）だが、**Bootstrap の JS と bootstrap-icons は
  CDN 読み込み**。レジ会計・テンキー・おつりは自前 JS なのでオフラインでも動くが、`/kanri` の「編集」
  折りたたみ（Bootstrap collapse）はオフラインだと開かない。本番がオフラインなら Bootstrap 一式の
  ローカル同梱を検討する。
