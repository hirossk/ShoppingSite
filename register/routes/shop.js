// routes/shop.js
// 学校祭レジ（POS）のルーター
//   /        … レジ画面（会計）
//   /shukei  … 集計（売上のまとめ）
//   /kanri   … 商品・在庫の管理

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const db      = require('../db/database');

// 商品画像の保存先（public/images）。ここに置いたファイルは /images/... で配信される。
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// 商品ボタンの色パレット（管理画面で選ぶ）
const COLORS = [
    '#e8590c', '#d6336c', '#ae3ec9', '#7048e8', '#1c7ed6',
    '#0ca678', '#37b24d', '#f08c00', '#e03131', '#495057',
];

// 管理画面のJavaScriptが 70x70 にリサイズした画像（data:image/...;base64,...）を送ってくる。
// それを public/images に実ファイルとして保存し、配信用パス（/images/item-xxx.png）を返す。
// 想定外の入力や保存失敗のときは空文字（画像なし）を返す。
function saveImageFromDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return '';
    const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(dataUrl);
    if (!m) return '';
    const ext  = m[1] === 'jpeg' ? 'jpg' : m[1];
    const data = m[2];
    if (data.length > 300000) return ''; // 70x70 なら通常数KB。巨大なものは弾く
    let buf;
    try {
        buf = Buffer.from(data, 'base64');
    } catch (e) {
        return '';
    }
    // 教材画像と混ざらないよう item- 接頭辞 ＋ 重複しない名前にする
    const fileName = 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext;
    try {
        if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
        fs.writeFileSync(path.join(IMAGES_DIR, fileName), buf);
    } catch (e) {
        console.error('画像の保存に失敗しました:', e);
        return '';
    }
    return '/images/' + fileName;
}

// このアプリが作った商品画像（item- で始まるもの）だけを削除する。
// 教材版から入っている画像（bag.png など）は消さない。
function deleteItemImage(imagePath) {
    if (!imagePath) return;
    const base = path.basename(imagePath);
    if (!base.startsWith('item-')) return; // 自分が作ったファイルだけ消す
    const full = path.join(IMAGES_DIR, base);
    try {
        if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch (e) { /* 消せなくても致命的ではないので無視 */ }
}

// ================================================================
// レジ画面（メイン）
// ================================================================
router.get('/', (req, res) => {
    const items    = db.findAllItems();
    const cartlist = db.findItemInCart();
    const total    = db.calcCartTotal(cartlist);
    const settings = db.getSettings();
    res.render('regi', { items, cartlist, total, settings, errorMsg: req.query.error || '' });
});

// 商品ボタンを押す → カゴに1つ追加
router.post('/regi/add/:code', (req, res) => {
    db.addToCart(parseInt(req.params.code, 10));
    res.redirect('/');
});

// カゴの個数を1つ増やす / 減らす
router.post('/regi/inc/:code', (req, res) => {
    db.addToCart(parseInt(req.params.code, 10));
    res.redirect('/');
});
router.post('/regi/dec/:code', (req, res) => {
    db.decreaseCart(parseInt(req.params.code, 10));
    res.redirect('/');
});

// カゴから1行削除
router.post('/regi/remove/:code', (req, res) => {
    db.removeFromCart(parseInt(req.params.code, 10));
    res.redirect('/');
});

// カゴを全部クリア（取り消し）
router.post('/regi/clear', (req, res) => {
    db.clearCart();
    res.redirect('/');
});

// 会計する（お預かり金額を受け取る）
router.post('/regi/checkout', (req, res) => {
    const paid = parseInt(req.body.paid, 10);
    if (isNaN(paid) || paid < 0) {
        return res.redirect('/?error=' + encodeURIComponent('お預かり金額を入力してください'));
    }
    const result = db.checkout(paid);
    if (!result.success) {
        return res.redirect('/?error=' + encodeURIComponent(result.message));
    }
    // 会計結果（おつり）をセッションに保存して結果画面へ
    req.session.lastSale = result.sale;
    res.redirect('/regi/done');
});

// 会計結果（おつり）画面
router.get('/regi/done', (req, res) => {
    const sale = req.session.lastSale;
    if (!sale) return res.redirect('/');
    res.render('regi_done', { sale });
});

// ================================================================
// 集計
// ================================================================
router.get('/shukei', (req, res) => {
    const summary = db.getSalesSummary();
    res.render('shukei', { summary });
});

// 売上の履歴（詳細）。会計ごとに、単価・個数まで表示する。
router.get('/shukei/rireki', (req, res) => {
    const history = db.getSalesHistory();
    res.render('shukei_rireki', { history });
});

// 集計をリセット（売上記録をすべて消す）
router.post('/shukei/reset', (req, res) => {
    db.resetSales();
    res.redirect('/shukei');
});

// ================================================================
// 商品・在庫の管理
// ================================================================
router.get('/kanri', (req, res) => {
    const items    = db.findAllItems();
    const settings = db.getSettings();
    res.render('kanri', { items, colors: COLORS, settings, message: req.query.msg || '' });
});

// レジの設定を保存（クイック入金額・ボタンの列数・高さ）
router.post('/kanri/settings', (req, res) => {
    db.saveSettings({
        quick1:     req.body.quick1,
        quick2:     req.body.quick2,
        quick3:     req.body.quick3,
        cols:       req.body.cols,
        btn_height: req.body.btn_height,
    });
    res.redirect('/kanri?msg=settings');
});

// 商品ボタンの並び順を1つ動かす（前へ / 後ろへ）
router.post('/kanri/move', (req, res) => {
    const code = parseInt(req.body.code, 10);
    const dir  = req.body.dir === 'up' ? 'up' : 'down';
    db.moveItem(code, dir);
    res.redirect('/kanri?msg=moved');
});

// 商品を新規登録（初期在庫つき）
router.post('/kanri/add', (req, res) => {
    const { name, price, stock, color, image } = req.body;
    const priceNum = parseInt(price, 10);
    const stockNum = parseInt(stock, 10);
    if (!name || !name.trim()) return res.redirect('/kanri?msg=error_name');
    if (isNaN(priceNum) || priceNum < 0) return res.redirect('/kanri?msg=error_price');
    db.addItem(name.trim(), priceNum, isNaN(stockNum) ? 0 : stockNum, color || COLORS[0], saveImageFromDataUrl(image));
    res.redirect('/kanri?msg=added');
});

// 商品の内容を更新（名前・値段・色）
router.post('/kanri/update', (req, res) => {
    const code = parseInt(req.body.code, 10);
    const { name, price, color, image, removeImage } = req.body;
    const priceNum = parseInt(price, 10);
    if (!name || !name.trim() || isNaN(priceNum) || priceNum < 0) {
        return res.redirect('/kanri?msg=error_edit');
    }
    // 画像の扱い：
    //   「画像を消す」にチェック → 古い画像ファイルを消して空文字で上書き
    //   新しい画像を選んだ        → 保存してそのパスで上書き（古い画像は消す）
    //   どちらでもない            → undefined を渡して画像は変更しない
    const old = db.findItemByCode(code);
    let img;
    if (removeImage) {
        img = '';
        if (old) deleteItemImage(old.image);
    } else if (image && image.trim()) {
        img = saveImageFromDataUrl(image);
        if (img && old) deleteItemImage(old.image); // 保存できたときだけ古いのを消す
    } else {
        img = undefined;
    }
    db.updateItem(code, name.trim(), priceNum, color, img);
    res.redirect('/kanri?msg=updated');
});

// 値段を変える（売り切りたいときの値下げなど）
router.post('/kanri/price', (req, res) => {
    const code  = parseInt(req.body.code, 10);
    const price = parseInt(req.body.price, 10);
    if (isNaN(price) || price < 0) return res.redirect('/kanri?msg=error_price');
    db.setPrice(code, price);
    res.redirect('/kanri?msg=priceset');
});

// 在庫を補充する（今の在庫に足す）
router.post('/kanri/stock/add', (req, res) => {
    const code   = parseInt(req.body.code, 10);
    const amount = parseInt(req.body.amount, 10);
    if (!isNaN(amount) && amount !== 0) db.addStock(code, amount);
    res.redirect('/kanri?msg=stocked');
});

// 在庫の数を直接そろえる（修正用）
router.post('/kanri/stock/set', (req, res) => {
    const code  = parseInt(req.body.code, 10);
    const stock = parseInt(req.body.stock, 10);
    if (!isNaN(stock) && stock >= 0) db.setStock(code, stock);
    res.redirect('/kanri?msg=stockset');
});

// 商品を削除
router.post('/kanri/delete', (req, res) => {
    const code = parseInt(req.body.code, 10);
    const item = db.findItemByCode(code);
    db.deleteItem(code);
    if (item) deleteItemImage(item.image); // 商品画像も後始末する
    res.redirect('/kanri?msg=deleted');
});

module.exports = router;
