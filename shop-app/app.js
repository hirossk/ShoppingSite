// app.js
// エントリーポイント（Spring Boot の ShoppingSiteApplication に相当）

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- ミドルウェア設定 ----

// EJSをテンプレートエンジンとして使用（ThymeleafのNode.js版）
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイル（CSS/JS/画像）の配信
app.use(express.static(path.join(__dirname, 'public')));

// POSTリクエストのボディをパース（@RequestBody に相当）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// セッション管理（Spring Security の代替）
app.use(session({
    secret: process.env.SESSION_SECRET || 'shopping-site-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ---- ルーター登録 ----
const shopRouter = require('./routes/shop');
app.use('/', shopRouter);

// ---- エラーハンドリング（授業用のためシンプルに） ----
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('エラーが発生しました: ' + err.message);
});

// ---- サーバー起動（DB初期化後に起動） ----
db.initDb().then(() => {
    app.listen(PORT, () => {
        console.log('==========================================');
        console.log('ショッピングサイトが起動しました！');
        console.log('ブラウザで以下のURLを開いてください:');
        console.log('  http://localhost:' + PORT);
        console.log('==========================================');
    });
}).catch(err => {
    console.error('DB初期化に失敗しました:', err);
    process.exit(1);
});
