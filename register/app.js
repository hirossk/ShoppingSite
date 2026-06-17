// app.js
// エントリーポイント（Spring Boot の ShoppingSiteApplication に相当）

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');
const os      = require('os');
const db      = require('./db/database');

// このPCのLAN内IPアドレス（IPv4）を取得する。
// 同じWi-Fi/LANにつないだスマホ・タブレットからこのアドレスで接続できる。
// 見つからなければ localhost を返す。
function getLocalIps() {
    const ips = [];
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            // IPv4 で、自分自身(127.0.0.1)以外のものだけ集める
            if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
        }
    }
    return ips.length ? ips : ['localhost'];
}

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- ミドルウェア設定 ----

// EJSをテンプレートエンジンとして使用（ThymeleafのNode.js版）
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイル（CSS/JS/画像）の配信
app.use(express.static(path.join(__dirname, 'public')));

// POSTリクエストのボディをパース（@RequestBody に相当）
// 画像（70x70 の data URL）も送られてくるので少し余裕を持たせる
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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
const forceReset = process.argv.includes('--initdb');
if (forceReset) console.log('--initdb フラグを検出：DBをリセットします');

db.initDb(forceReset).then(() => {
    app.listen(PORT, '0.0.0.0',() => {
        const ips = getLocalIps();
        console.log('==========================================');
        console.log('レジが起動しました！');
        console.log('このPCのブラウザはこちら:');
        console.log('  http://localhost:' + PORT);
        console.log('同じネットワークのスマホ・他のPCからは:');
        ips.forEach(ip => console.log('  http://' + ip + ':' + PORT));
        console.log('==========================================');
    });
}).catch(err => {
    console.error('DB初期化に失敗しました:', err);
    process.exit(1);
});
