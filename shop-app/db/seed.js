// db/seed.js
// ======================================================
//  初期データ投入ファイル
//  ここに商品を追加してみよう！
//
//  INSERT INTO テーブル名 (列1, 列2, ...) VALUES (値1, 値2, ...)
//  → テーブルに1行データを追加する命令
// ======================================================

function insertSeedData(db) {

    // ---- 商品データ（自由に追加・変更してOK！） ----

    db.run(`INSERT INTO item (name, price, image, stock) VALUES ('ギター',       30000, 'guitar',   10)`);
    db.run(`INSERT INTO item (name, price, image, stock) VALUES ('キーボード',   48000, 'midi',     10)`);
    db.run(`INSERT INTO item (name, price, image, stock) VALUES ('エレクトーン', 300000, 'electone', 10)`);

}

module.exports = { insertSeedData };
