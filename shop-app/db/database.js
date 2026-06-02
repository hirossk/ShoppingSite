// db/database.js
// SQLiteデータベースアクセス層（sql.jsを使用）
// sql.jsはPure JSのためビルド不要、コピーだけで動作する

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

// DBファイルのパス（shop-appフォルダの直下）
const DB_PATH = path.join(__dirname, '..', 'shop.db');

let db = null; // sql.jsのDBインスタンス（メモリ上に展開）

// DBをファイルに書き戻す関数（変更時は必ず呼ぶこと）
function saveDb() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// DB初期化（起動時に1回呼ぶ）
async function initDb() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        // 既存DBをメモリにロード
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('既存のDBを読み込みました: ' + DB_PATH);
    } else {
        // 新規DB作成
        db = new SQL.Database();

        // テーブル作成
        db.run(`
            CREATE TABLE IF NOT EXISTS item (
                code  INTEGER PRIMARY KEY AUTOINCREMENT,
                name  TEXT,
                price INTEGER,
                image TEXT
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS cart (
                code  INTEGER PRIMARY KEY,
                count INTEGER NOT NULL
            )
        `);

        // 初期データ投入
        db.run(`INSERT INTO item (code, name, price, image) VALUES (1, 'ギター',        30000,  'guitar')`);
        db.run(`INSERT INTO item (code, name, price, image) VALUES (2, 'ミディキーボード', 48000, 'midi')`);
        db.run(`INSERT INTO item (code, name, price, image) VALUES (3, 'エレクトーン',   300000, 'electone')`);

        saveDb();
        console.log('新規DBを作成しました: ' + DB_PATH);
    }
}

// ---- ITEM テーブル操作 ----

// 全商品取得
function findAllItems() {
    const stmt = db.prepare('SELECT code, name, price, image FROM item ORDER BY code');
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// ---- CART テーブル操作 ----

// カートの商品とITEM情報をJOINして取得
function findItemInCart() {
    const stmt = db.prepare(`
        SELECT item.code AS code, item.name AS name, cart.count AS count,
               item.price AS price, item.image AS image
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

module.exports = {
    initDb,
    findAllItems,
    findItemInCart,
    addToCart,
    removeFromCart,
};
