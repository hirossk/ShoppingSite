// routes/shop.js
// Spring Boot の ReqController に相当するルーター

const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// ---- トップページ ----
// Spring Boot: @GetMapping("/")
router.get('/', (req, res) => {
    res.render('index');
});

// ---- 一覧表示（テーブル形式） ----
// Spring Boot: @GetMapping("list")
router.get('/list', (req, res) => {
    // itemテーブルの一覧取得
    const itemList = db.findAllItems();
    // EJSでアクセスするためにモデル"itemlist"へ格納
    res.render('list', { itemlist: itemList });
});

// ---- 商品カード一覧表示 ----
// Spring Boot: @GetMapping("cardlist")
router.get('/cardlist', (req, res) => {
    const itemList = db.findAllItems();
    res.render('cardlist', { itemlist: itemList });
});

// ---- ショップページ ----
// Spring Boot: @GetMapping("shop")
router.get('/shop', (req, res) => {
    const itemList = db.findAllItems();
    res.render('shop', { itemlist: itemList });
});

// ---- このサイトについて ----
// Spring Boot: @GetMapping("about")
router.get('/about', (req, res) => {
    res.render('about');
});

// ---- カート一覧表示 ----
// Spring Boot: @GetMapping("cart")
router.get('/cart', (req, res) => {
    const cartList = db.findItemInCart();
    res.render('cart', { cartlist: cartList });
});

// ---- カートに追加 ----
// Spring Boot: @GetMapping("/cart/{code}")
router.get('/cart/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    // カートに一つ追加する
    db.addToCart(code);
    // cartの内容を取得する
    const cartList = db.findItemInCart();
    // カートを表示する
    res.render('cart', { cartlist: cartList });
});

// ---- カートから削除 ----
// Spring Boot: @GetMapping("/del/{code}")
router.get('/del/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    // カートから対象コードの商品を削除する
    db.removeFromCart(code);
    // cartの内容を取得する
    const cartList = db.findItemInCart();
    // カートを表示する
    res.render('cart', { cartlist: cartList });
});

module.exports = router;
