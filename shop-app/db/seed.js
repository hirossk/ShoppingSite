// db/seed.js
// ======================================================
//  初期データ投入ファイル
//  ここに商品を追加してみよう！
//
//  INSERT INTO テーブル名 (列1, 列2, ...) VALUES (値1, 値2, ...)
//  → テーブルに1行データを追加する命令
//
//  列の順番： name（商品名）, price（価格）, image（画像名）,
//            stock（在庫）, description（商品詳細ページの説明文）
// ======================================================

function insertSeedData(db) {

    // ---- 商品データ（自由に追加・変更してOK！） ----

    db.run(`INSERT INTO item (name, price, image, stock, description) VALUES ('ギター',       30000, 'guitar',   10, '初心者にもやさしいアコースティックギター。軽くて弾きやすく、はじめの1本にぴったりです。')`);
    db.run(`INSERT INTO item (name, price, image, stock, description) VALUES ('キーボード',   48000, 'midi',     10, '61鍵のスタンダードなキーボード。たくさんの音色が入っていて、練習にも演奏にも使えます。')`);
    db.run(`INSERT INTO item (name, price, image, stock, description) VALUES ('エレクトーン', 300000, 'electone', 10, '足鍵盤までついた本格エレクトーン。1台でバンドのような演奏が楽しめる上位モデルです。')`);

}

module.exports = { insertSeedData };
