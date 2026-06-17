// db/database.js
// SQLiteデータベースアクセス層（sql.jsを使用）
// sql.jsはPure JSのためビルド不要、コピーだけで動作する
//
// ★このアプリは「学校祭のレジ（POS）」です。
//   item       … 売る商品（名前・値段・在庫・ボタンの色）
//   cart       … いま会計中のお客さん1人ぶんのカゴ（商品コードと個数）
//   sale       … 会計が終わった1回ぶんの記録（合計・お預かり・おつり・日時）
//   sale_line  … その会計で何をいくつ売ったか（集計のもと）

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');
const { insertSeedData } = require('./seed');

// DBファイルのパス（shop-appフォルダの直下）
const DB_PATH = path.join(__dirname, '..', 'shop.db');

let db = null; // sql.jsのDBインスタンス（メモリ上に展開）

// レジの見た目・操作の設定（管理画面で変えられる）。DBに無いときはこの値を使う。
const SETTINGS_DEFAULTS = {
    quick1:     500,   // クイック入金ボタン1の金額
    quick2:     1000,  // クイック入金ボタン2の金額
    quick3:     5000,  // クイック入金ボタン3の金額
    cols:       4,     // 商品ボタンを1行に何個並べるか（PC表示）
    btn_height: 120,   // 商品ボタンの高さ（px）
};

// DBをファイルに書き戻す関数（変更時は必ず呼ぶこと）
function saveDb() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// すべてのテーブルを作成（無ければ作る）
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS item (
            code  INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT    NOT NULL,
            price INTEGER NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            color TEXT    DEFAULT '#0d6efd',
            image TEXT    DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    `);
    // レジの設定（キー＝値）。クイック入金額・ボタンの列数や高さなど。
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS cart (
            code  INTEGER PRIMARY KEY,
            count INTEGER NOT NULL
        )
    `);
    // 会計1回ぶんの記録
    db.run(`
        CREATE TABLE IF NOT EXISTS sale (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT    NOT NULL,
            total      INTEGER NOT NULL,
            paid       INTEGER NOT NULL,
            change     INTEGER NOT NULL
        )
    `);
    // 会計の明細（何をいくつ売ったか）→ 集計のもと
    db.run(`
        CREATE TABLE IF NOT EXISTS sale_line (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            code    INTEGER,
            name    TEXT    NOT NULL,
            price   INTEGER NOT NULL,
            count   INTEGER NOT NULL
        )
    `);
}

// DB初期化（起動時に1回呼ぶ）
// forceReset=true のとき既存DBを削除して作り直す（run_reset.bat = --initdb 用）
async function initDb(forceReset = false) {
    const SQL = await initSqlJs();

    if (!forceReset && fs.existsSync(DB_PATH)) {
        // 既存DBをメモリにロード
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);

        // 古いDBにも足りない列・テーブルを補う（後方互換マイグレーション）
        try {
            db.run("ALTER TABLE item ADD COLUMN color TEXT DEFAULT '#0d6efd'");
        } catch (e) { /* すでにある場合は無視 */ }
        try {
            db.run('ALTER TABLE item ADD COLUMN stock INTEGER NOT NULL DEFAULT 0');
        } catch (e) { /* すでにある場合は無視 */ }
        try {
            db.run("ALTER TABLE item ADD COLUMN image TEXT DEFAULT ''");
        } catch (e) { /* すでにある場合は無視 */ }
        try {
            db.run('ALTER TABLE item ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
        } catch (e) { /* すでにある場合は無視 */ }
        createTables(); // sale / sale_line / settings などが無ければ作る
        saveDb();
        console.log('既存のDBを読み込みました: ' + DB_PATH);
    } else {
        // 新規DB作成（または --initdb によるリセット）
        if (forceReset && fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            console.log('既存のDBを削除しました（リセット）');
        }

        db = new SQL.Database();
        createTables();

        // 初期データ投入（db/seed.js から読み込む。空でもOK）
        insertSeedData(db);

        saveDb();
        console.log('新規DBを作成しました: ' + DB_PATH);
    }
}

// ---- ITEM（商品）テーブル操作 ----

// 全商品取得
function findAllItems() {
    // 並び順（sort_order）→ 同じなら code 順。レジ・管理どちらもこの順で並ぶ。
    const stmt = db.prepare('SELECT code, name, price, stock, color, image, sort_order FROM item ORDER BY sort_order, code');
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

// 商品を1件取得
function findItemByCode(code) {
    const stmt = db.prepare('SELECT code, name, price, stock, color, image FROM item WHERE code = ?');
    stmt.bind([code]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
}

// 商品を1件追加（初期在庫つき）。image は 70x70 の data URL（無ければ空文字）。
function addItem(name, price, stock, color, image) {
    // 新しい商品は今ある中で一番うしろに並べる
    const res = db.exec('SELECT IFNULL(MAX(sort_order), 0) + 1 AS next FROM item');
    const nextOrder = res.length ? res[0].values[0][0] : 1;
    db.run(
        'INSERT INTO item (name, price, stock, color, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, stock, color || '#0d6efd', image || '', nextOrder]
    );
    saveDb();
}

// 商品の並び順を1つ前/後ろに動かす（dir: 'up' で前へ、'down' で後ろへ）。
// 動かすたびに sort_order を 0,1,2... に振り直すので、古いDBでも確実に並ぶ。
function moveItem(code, dir) {
    const items = findAllItems();
    const idx = items.findIndex(it => it.code === code);
    if (idx < 0) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return; // 端なら何もしない
    const tmp = items[idx];
    items[idx] = items[target];
    items[target] = tmp;
    items.forEach((it, i) => {
        db.run('UPDATE item SET sort_order = ? WHERE code = ?', [i, it.code]);
    });
    saveDb();
}

// 商品の内容を更新（名前・値段・色・画像）。
// image が undefined のときは画像を変更しない（新しい画像を選ばずに更新したケース）。
function updateItem(code, name, price, color, image) {
    if (image === undefined) {
        db.run(
            'UPDATE item SET name = ?, price = ?, color = ? WHERE code = ?',
            [name, price, color || '#0d6efd', code]
        );
    } else {
        db.run(
            'UPDATE item SET name = ?, price = ?, color = ?, image = ? WHERE code = ?',
            [name, price, color || '#0d6efd', image, code]
        );
    }
    saveDb();
}

// 値段だけを変える（売り切りたいときの値下げなどに使う）
function setPrice(code, price) {
    db.run('UPDATE item SET price = ? WHERE code = ?', [price, code]);
    saveDb();
}

// 在庫を補充する（今の在庫に amount を足す）
function addStock(code, amount) {
    db.run('UPDATE item SET stock = stock + ? WHERE code = ?', [amount, code]);
    saveDb();
}

// 在庫の数を指定の値にそろえる（在庫の修正用）
function setStock(code, stock) {
    db.run('UPDATE item SET stock = ? WHERE code = ?', [stock, code]);
    saveDb();
}

// 商品を1件削除（カゴからも消す）
function deleteItem(code) {
    db.run('DELETE FROM item WHERE code = ?', [code]);
    db.run('DELETE FROM cart WHERE code = ?', [code]);
    saveDb();
}

// ---- CART（会計中のカゴ）テーブル操作 ----

// カゴの中身を商品情報とJOINして取得
function findItemInCart() {
    const stmt = db.prepare(`
        SELECT item.code AS code, item.name AS name, cart.count AS count,
               item.price AS price, item.stock AS stock, item.color AS color,
               item.image AS image
        FROM item
        INNER JOIN cart ON (item.code = cart.code)
        ORDER BY item.code
    `);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

function findCartById(code) {
    const stmt = db.prepare('SELECT code, count FROM cart WHERE code = ?');
    stmt.bind([code]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
}

// カゴに商品を1つ追加（なければ1個、あれば+1）。在庫を超えては増やさない。
function addToCart(code) {
    const item = findItemByCode(code);
    if (!item) return;
    const current = findCartById(code);
    const have = current ? current.count : 0;
    if (have >= item.stock) return; // 在庫より多くはカゴに入れない
    if (current) {
        db.run('UPDATE cart SET count = ? WHERE code = ?', [have + 1, code]);
    } else {
        db.run('INSERT INTO cart (code, count) VALUES (?, 1)', [code]);
    }
    saveDb();
}

// カゴの個数を1つ減らす（0になったらカゴから外す）
function decreaseCart(code) {
    const current = findCartById(code);
    if (!current) return;
    if (current.count <= 1) {
        db.run('DELETE FROM cart WHERE code = ?', [code]);
    } else {
        db.run('UPDATE cart SET count = ? WHERE code = ?', [current.count - 1, code]);
    }
    saveDb();
}

// カゴから商品を削除
function removeFromCart(code) {
    db.run('DELETE FROM cart WHERE code = ?', [code]);
    saveDb();
}

// カゴを空にする
function clearCart() {
    db.run('DELETE FROM cart');
    saveDb();
}

// カゴの合計金額
function calcCartTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.count, 0);
}

// ---- 会計（チェックアウト）----

// お預かり paid 円で会計する。
// 在庫を減らし、sale / sale_line に記録してカゴを空にする。
// 戻り値: { success:true, sale } または { success:false, message }
function checkout(paid) {
    const cartItems = findItemInCart();

    if (cartItems.length === 0) {
        return { success: false, message: 'カゴが空です' };
    }

    const total = calcCartTotal(cartItems);

    if (paid < total) {
        return { success: false, message: `お預かりが足りません（あと ${total - paid} 円）` };
    }

    // 在庫チェック
    for (const item of cartItems) {
        if (item.stock < item.count) {
            return { success: false, message: `「${item.name}」の在庫が足りません（在庫: ${item.stock}個）` };
        }
    }

    const change = paid - total;
    const createdAt = new Date().toISOString();

    // 在庫を減らす
    for (const item of cartItems) {
        db.run('UPDATE item SET stock = stock - ? WHERE code = ?', [item.count, item.code]);
    }

    // 会計を記録
    db.run('INSERT INTO sale (created_at, total, paid, change) VALUES (?, ?, ?, ?)',
        [createdAt, total, paid, change]);
    const saleId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];

    for (const item of cartItems) {
        db.run('INSERT INTO sale_line (sale_id, code, name, price, count) VALUES (?, ?, ?, ?, ?)',
            [saleId, item.code, item.name, item.price, item.count]);
    }

    // カゴを空にする
    db.run('DELETE FROM cart');
    saveDb();

    return {
        success: true,
        sale: { id: saleId, items: cartItems, total, paid, change, createdAt },
    };
}

// ---- 集計 ----

// 商品ごとの売れた個数・売上をまとめる
function getSalesSummary() {
    // 商品別の集計（sale_line を商品名でまとめる）
    const byItem = [];
    const stmt = db.prepare(`
        SELECT name,
               SUM(count)         AS qty,
               SUM(price * count) AS revenue
        FROM sale_line
        GROUP BY name
        ORDER BY revenue DESC
    `);
    while (stmt.step()) byItem.push(stmt.getAsObject());
    stmt.free();

    // 全体の合計
    const totalsRes = db.exec(
        'SELECT COUNT(*) AS txn, IFNULL(SUM(total),0) AS revenue FROM sale'
    );
    const t = totalsRes.length ? totalsRes[0].values[0] : [0, 0];

    // 売れた個数の合計
    const qtyRes = db.exec('SELECT IFNULL(SUM(count),0) AS q FROM sale_line');
    const totalQty = qtyRes.length ? qtyRes[0].values[0][0] : 0;

    return {
        byItem,
        txnCount: t[0],
        totalRevenue: t[1],
        totalQty,
    };
}

// 会計ごとの履歴（新しい順）。1回の会計＝1行で、時刻・明細・金額をまとめて返す。
function getSalesHistory() {
    // 会計（sale）を新しい順に取る
    const sales = [];
    const stmt = db.prepare(
        'SELECT id, created_at, total, paid, change FROM sale ORDER BY id DESC'
    );
    while (stmt.step()) {
        const s = stmt.getAsObject();
        s.lines = [];
        sales.push(s);
    }
    stmt.free();

    // それぞれの会計の明細（何をいくつ売ったか）をくっつける
    const byId = {};
    sales.forEach(s => { byId[s.id] = s; });
    const lstmt = db.prepare(
        'SELECT sale_id, name, price, count FROM sale_line ORDER BY id'
    );
    while (lstmt.step()) {
        const line = lstmt.getAsObject();
        if (byId[line.sale_id]) byId[line.sale_id].lines.push(line);
    }
    lstmt.free();

    return sales;
}

// 集計（売上の記録）をすべて消す。在庫はそのまま。
function resetSales() {
    db.run('DELETE FROM sale');
    db.run('DELETE FROM sale_line');
    saveDb();
}

// ---- 設定（レジの見た目・操作）----

// 設定を読む。DBに無いキーは SETTINGS_DEFAULTS で補う。値はすべて数値で返す。
function getSettings() {
    const s = Object.assign({}, SETTINGS_DEFAULTS);
    const stmt = db.prepare('SELECT key, value FROM settings');
    while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.key in s) {
            const n = parseInt(row.value, 10);
            if (!isNaN(n)) s[row.key] = n;
        }
    }
    stmt.free();
    return s;
}

// 設定を保存する。SETTINGS_DEFAULTS にあるキーだけを受け付ける（数値のみ）。
function saveSettings(obj) {
    Object.keys(SETTINGS_DEFAULTS).forEach(key => {
        if (obj[key] === undefined) return;
        const n = parseInt(obj[key], 10);
        if (isNaN(n)) return;
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(n)]);
    });
    saveDb();
}

module.exports = {
    initDb,
    // 商品
    findAllItems,
    findItemByCode,
    addItem,
    updateItem,
    setPrice,
    addStock,
    setStock,
    deleteItem,
    moveItem,
    // カゴ
    findItemInCart,
    addToCart,
    decreaseCart,
    removeFromCart,
    clearCart,
    calcCartTotal,
    // 会計・集計
    checkout,
    getSalesSummary,
    getSalesHistory,
    resetSales,
    // 設定
    getSettings,
    saveSettings,
};
