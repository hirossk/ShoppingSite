// routes/shop.js
// Spring Boot の ReqController に相当するルーター

const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// 選べる画像の一覧（public/images/ にある画像ファイル名）
const IMAGE_LIST = [
    'guitar', 'midi', 'electone', 'piano', 'trumpet', 'sax', 'horn', 'dram', 'timpani',
    'notepc', 'tablet', 'phone', 'earphone', 'drone', 'watch', 'meter',
    'bike1', 'bike2', 'kickboard',
    'jacket', 'jeans1', 'jeans2', 'hat1', 'visor', 'shoes1', 'shoes2', 'shose3', 'shose4',
    'sandal1', 'sandal2', 'crocs1', 'crocs2', 'megane1', 'megane2', 'megane3',
    'bag', 'ruck',
    'microwave', 'suihanki', 'washing', 'soujiki', 'fryingpan', 'pot', 'silverpot', 'handmixer', 'konro',
    'ballpen1', 'ballpen2', 'hasami', 'stapler', 'tape', 'bond', 'board',
    'baseball', 'tennis',
    'candle1', 'candle2',
    'thermometer', 'bad',
];

// ================================================================
// 【完成版の店】トップページ（お店の表紙）
//   生徒が Step1〜6 を作り終えると、ここが本物のお店の入口になる。
// ================================================================
router.get('/', (req, res) => {
    const itemlist = db.findAllItems();
    // おすすめ商品として先頭の最大8件だけ表紙に並べる
    const featured = itemlist.slice(0, 8);
    res.render('index', { featured });
});

// ================================================================
// 【完成版の店】商品一覧（ショップ）
// ================================================================
router.get('/shop', (req, res) => {
    const itemlist = db.findAllItems();
    res.render('shop', { itemlist });
});

// 【完成版の店】カートに入れる → カート画面へ
router.get('/shop/add/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    db.addToCart(code);
    res.redirect('/cart');
});

// ================================================================
// 【完成版の店】カート確認・購入
// ================================================================
router.get('/cart', (req, res) => {
    const cartlist = db.findItemInCart();
    const total    = db.calcCartTotal(cartlist);
    const errorMsg = req.query.error || '';
    res.render('cart', { cartlist, total, errorMsg });
});

// 【完成版の店】カートから削除
router.get('/cart/remove/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    db.removeFromCart(code);
    res.redirect('/cart');
});

// 【完成版の店】購入処理 → 購入完了ページへ
router.post('/buy', (req, res) => {
    const result = db.purchase();
    if (!result.success) {
        return res.redirect('/cart?error=' + encodeURIComponent(result.message));
    }
    const total = db.calcCartTotal(result.items);
    req.session.lastOrder = { items: result.items, total };
    res.redirect('/complete');
});

// 【完成版の店】購入完了
router.get('/complete', (req, res) => {
    const order = req.session.lastOrder || { items: [], total: 0 };
    res.render('complete', { order });
});

// ================================================================
// 【完成版の店】商品詳細ページ（カードの「詳細」から開く）
// ================================================================
router.get('/item/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    const item = db.findItemByCode(code);
    if (!item) {
        return res.status(404).render('item', { item: null, addUrl: '/shop/add' });
    }
    res.render('item', { item, addUrl: '/shop/add' });
});

// ================================================================
// 【学習用】Step 1〜6 の案内メニュー（授業で作る過程を残してある）
// ================================================================
router.get('/steps', (req, res) => {
    res.render('index_steps');
});

// ================================================================
// Step 1：データエントリー
// ================================================================
router.get('/step1', (req, res) => {
    const itemlist = db.findAllItems();
    res.render('step1', {
        itemlist,
        imageList: IMAGE_LIST,
        message: req.query.msg || '',
    });
});

router.post('/step1', (req, res) => {
    const { name, price, image, description } = req.body;

    // 簡易バリデーション
    if (!name || !price || !image) {
        return res.redirect('/step1?msg=error_empty');
    }

    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
        return res.redirect('/step1?msg=error_price');
    }

    db.addItem(name.trim(), priceNum, image, (description || '').trim());
    res.redirect('/step1?msg=added');
});

// Step 1：商品削除
router.post('/step1/delete', (req, res) => {
    const code = parseInt(req.body.code, 10);
    db.deleteItem(code);
    res.redirect('/step1?msg=deleted');
});

// ================================================================
// Step 2：カード形式で表示（画像・価格・在庫）＋ 商品詳細ページ
// ================================================================
router.get('/step2', (req, res) => {
    const itemlist = db.findAllItems();
    res.render('step2', { itemlist });
});

// ================================================================
// Step 3：カートに入れる（カードに「カートに入れる」ボタン）
// ================================================================
router.get('/step3', (req, res) => {
    const itemlist = db.findAllItems();
    res.render('step3', { itemlist });
});

// カートに追加 → カート画面（Step4）へ
router.get('/cart/add/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    db.addToCart(code);
    res.redirect('/step4');
});

// ================================================================
// Step 4：購入する（カート確認 → 買うと在庫が減る）
// ================================================================
router.get('/step4', (req, res) => {
    const cartlist  = db.findItemInCart();
    const total     = db.calcCartTotal(cartlist);
    const errorMsg  = req.query.error || '';
    res.render('step4', { cartlist, total, errorMsg });
});

// カートから削除
router.get('/cart/del/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    db.removeFromCart(code);
    res.redirect('/step4');
});

// 購入処理（POST）→ 在庫を減らして購入完了（Step5）へ
router.post('/purchase', (req, res) => {
    const result = db.purchase();
    if (!result.success) {
        return res.redirect('/step4?error=' + encodeURIComponent(result.message));
    }
    const total = db.calcCartTotal(result.items);
    // 購入した商品と合計をセッションに保存してStep5へ
    req.session.lastOrder = { items: result.items, total };
    res.redirect('/step5');
});

// ================================================================
// Step 5：購入完了画面
// ================================================================
router.get('/step5', (req, res) => {
    const order = req.session.lastOrder || { items: [], total: 0 };
    res.render('step5', { order });
});

// ================================================================
// 旧URL互換（既存リンクが壊れないように残す）
// ================================================================
router.get('/list',     (req, res) => res.redirect('/step2'));
router.get('/cardlist', (req, res) => res.redirect('/step2'));
router.get('/step6',    (req, res) => res.redirect('/step5'));
router.get('/about',    (req, res) => res.render('about'));

module.exports = router;
