package jp.shopping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

//テーブル結合用のクラス
@Data
@AllArgsConstructor
public class ItemCountDto{
	//商品コード
    private Integer code;
    //商品名
    private String name;
    //カートの数
    private Integer count;
    //価格
    private Integer price;
    //画像ファイル名
    private String image;

    public ItemCountDto(Object[] objects) {
        this(
        		//デフォルトコンストラクタの引数として渡す
                ((Integer) objects[0]).intValue(),
                (String) objects[1],
                ((Integer) objects[2]).intValue(),
                ((Integer) objects[3]).intValue(),
                (String) objects[4]
                );
    }
}