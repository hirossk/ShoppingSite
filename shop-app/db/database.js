// db/database.js
// SQLiteデータベースアクセス層（sql.jsを使用）
// sql.jsはPure JSのためビルド不要、コピーだけで動作する

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');
const { insertSeedData } = require('./seed');

// DBファイルのパス（shop-appフォルダの直下）
const DB_PATH = path.join(__dirname, '..', 'shop.db');

let db = null; // sql.jsのDBインスタンス（メモリ上に展開）

// DBをファイルに書き戻す関数（変更時は必ず呼ぶこと）
function saveDb() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// DB初期化（起動時に1回呼ぶ）
// forceReset=true のとき既存DBを削除して作り直す（run.bat --initdb 用）
async function initDb(forceReset = false) {
    const SQL = await initSqlJs();

    if (!forceReset && fs.existsSync(DB_PATH)) {
        // 既存DBをメモリにロード
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);

        // stockカラムが無ければ追加（既存DBへの対応）
        try {
            db.run('ALTER TABLE item ADD COLUMN stock INTEGER DEFAULT 10');
            db.run('UPDATE item SET stock = 10 WHERE stock IS NULL');
            saveDb();
            console.log('stockカラムを追加しました');
        } catch (e) {
            // すでにある場合は無視
        }

        // descriptionカラムが無ければ追加（商品詳細ページ用）
        try {
            db.run("ALTER TABLE item ADD COLUMN description TEXT DEFAULT ''");
            saveDb();
            console.log('descriptionカラムを追加しました');
        } catch (e) {
            // すでにある場合は無視
        }
        console.log('既存のDBを読み込みました: ' + DB_PATH);
    } else {
        // 新規DB作成（または --initdb によるリセット）
        if (forceReset && fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            console.log('既存のDBを削除しました（リセット）');
        }

        db = new SQL.Database();

        // テーブル作成（stockカラム付き）
        db.run(`
            CREATE TABLE IF NOT EXISTS item (
                code        INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                price       INTEGER NOT NULL,
                image       TEXT    NOT NULL,
                stock       INTEGER NOT NULL DEFAULT 10,
                description TEXT    DEFAULT ''
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS cart (
                code  INTEGER PRIMARY KEY,
                count INTEGER NOT NULL
            )
        `);

        // 初期データ投入（db/seed.js から読み込む）
        insertSeedData(db);

        saveDb();
        console.log('新規DBを作成しました: ' + DB_PATH);
    }
}

// ---- ITEM テーブル操作 ----

// 全商品取得（在庫付き）
function findAllItems() {
    const stmt = db.prepare('SELECT code, name, price, image, stock, description FROM item ORDER BY code');
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// 商品を1件取得（商品詳細ページ用）
function findItemByCode(code) {
    const stmt = db.prepare('SELECT code, name, price, image, stock, description FROM item WHERE code = ?');
    stmt.bind([code]);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

// 商品を1件追加（Step1のデータエントリー）
function addItem(name, price, image, description = '') {
    db.run(
        'INSERT INTO item (name, price, image, stock, description) VALUES (?, ?, ?, 10, ?)',
        [name, price, image, description]
    );
    saveDb();
}

// 商品を1件削除
function deleteItem(code) {
    db.run('DELETE FROM item WHERE code = ?', [code]);
    db.run('DELETE FROM cart WHERE code = ?', [code]);
    saveDb();
}

// ---- CART テーブル操作 ----

// カートの商品とITEM情報をJOINして取得
function findItemInCart() {
    const stmt = db.prepare(`
        SELECT item.code AS code, item.name AS name, cart.count AS count,
               item.price AS price, item.image AS image, item.stock AS stock
        FROM item
        INNER JOIN cart ON (item.code = cart.code)
        ORDER BY item.code
    `);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// カートから特定商品の情報を取得
function findCartById(code) {
    const stmt = db.prepare('SELECT code, count FROM cart WHERE code = ?');
    stmt.bind([code]);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

// カートに商品を追加（なければINSERT、あればUPDATE）
function addToCart(code) {
    const current = findCartById(code);
    if (current) {
        // 既にカートにある → 数量を1増やす
        db.run('UPDATE cart SET count = ? WHERE code = ?', [current.count + 1, code]);
    } else {
        // 新規追加
        db.run('INSERT INTO cart (code, count) VALUES (?, 1)', [code]);
    }
    saveDb();
}

// カートから商品を削除
function removeFromCart(code) {
    db.run('DELETE FROM cart WHERE code = ?', [code]);
    saveDb();
}

// カートを空にする
function clearCart() {
    db.run('DELETE FROM cart');
    saveDb();
}

// 購入処理：在庫を減らしてカートを空にする
// 戻り値: { success: true, items } または { success: false, message }
function purchase() {
    const cartItems = findItemInCart();

    if (cartItems.length === 0) {
        return { success: false, message: 'カートが空です' };
    }

    // 在庫チェック
    for (const item of cartItems) {
        if (item.stock < item.count) {
            return {
                success: false,
                message: `「${item.name}」の在庫が足りません（在庫: ${item.stock}個）`
            };
        }
    }

    // 在庫を減らす
    for (const item of cartItems) {
        // 【課題4-B 穴埋め】買った数だけ在庫を減らそう！（ここは本物のプログラム＝計算だよ）
        //   item.stock … 今の在庫の数
        //   item.count … カートに入っている（買う）数
        //   新しい在庫 ＝ 今の在庫 − 買った数  → item.stock - item.count
        //   ↓ 今は item.stock（今の在庫）のままなので、在庫が減りません。ここを直そう！
        const newStock = item.stock;
        db.run(
            'UPDATE item SET stock = ? WHERE code = ?',
            [newStock, item.code]
        );
    }

    // カートを空にする
    db.run('DELETE FROM cart');
    saveDb();

    return { success: true, items: cartItems };
}

// カートの合計金額を計算
function calcCartTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.count, 0);
}

module.exports = {
    initDb,
    findAllItems,
    findItemByCode,
    addItem,
    deleteItem,
    findItemInCart,
    addToCart,
    removeFromCart,
    clearCart,
    purchase,
    calcCartTotal,
};
