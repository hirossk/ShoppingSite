DELETE FROM "PUBLIC"."CART";
DELETE FROM "PUBLIC"."ITEM";

--ここから修正します。
INSERT INTO "PUBLIC"."ITEM" VALUES
(1, 'ギター', 30000, 'guitar',1,'instrument'),
(2, 'ミディキーボード', 48000, 'midi',1,'instrument'),
(3, 'エレクトーン', 300000, 'electone',1,'instrument'),
(4, '黒ボールペン', 200, 'ballpen1',2,'instrument'),
(5, 'ボンド', 150, 'bond',2,'instrument'),
(6, '赤ボールペン', 200, 'ballpen2',2,'instrument'),
(7, '紙テープ', 250, 'tape',2,'instrument'),
(8, '洗濯機', 200000, 'dram',4,'instrument'),
(9, 'ノートPC', 150000, 'notepc',4,'instrument'),
(10, '自転車（青）', 40000, 'bike1',6,'instrument'),
(11, '自転車（赤）', 40000, 'bike2',6,'instrument'),
(12, 'ドローン', 120000, 'drone',4,'instrument'),
(13, 'ポット', 4000, 'pot',3,'instrument'),
(14, 'コンロ', 6000, 'konro',3,'instrument'),
(15, 'トートバッグ', 2500, 'bag',5,'instrument'),
(16, 'バドミントンラケット', 9000, 'bad',6,'instrument'),
(17, 'ハサミ', 600, 'hasami',2,'instrument')
;
           
