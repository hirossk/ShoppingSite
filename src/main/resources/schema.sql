-- H2 2.1.214;
;             
CREATE USER IF NOT EXISTS "SA" SALT '296fe53e8362bb74' HASH 'a3c1cec86e8664fcae0fbd6782e1cbcee4deb7405242e65f959702311bee066b' ADMIN;         

DROP TABLE IF EXISTS item;
CREATE MEMORY TABLE "PUBLIC"."ITEM"(
    "CODE" INTEGER GENERATED BY DEFAULT AS IDENTITY(START WITH 1 RESTART WITH 7) NOT NULL,
    "NAME" CHARACTER VARYING(255),
    "PRICE" INTEGER,
    "IMAGE" CHARACTER VARYING(255)
);            
ALTER TABLE "PUBLIC"."ITEM" ADD CONSTRAINT "PUBLIC"."CONSTRAINT_2" PRIMARY KEY("CODE");       
-- 6 +/- SELECT COUNT(*) FROM PUBLIC.ITEM;    

DROP TABLE IF EXISTS cart;               
CREATE MEMORY TABLE "PUBLIC"."CART"(
    "CODE" INTEGER NOT NULL,
    "COUNT" INTEGER NOT NULL
);          
ALTER TABLE "PUBLIC"."CART" ADD CONSTRAINT "PUBLIC"."CONSTRAINT_1" PRIMARY KEY("CODE");       
-- 5 +/- SELECT COUNT(*) FROM PUBLIC.CART;    
