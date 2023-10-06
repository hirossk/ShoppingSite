package jp.shopping.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import jp.shopping.dto.ItemCountDto;
import jp.shopping.entity.Cart;
import jp.shopping.entity.Item;
import jp.shopping.repository.CartRepository;
import jp.shopping.repository.ItemRepository;

@Controller
public class ReqController {
    //カートに追加処理
    @GetMapping("/cart/{code}")
    public String cartIn(@PathVariable Integer code,Model model) {
        //カートにデータを追加する処理
        Cart cart;
        //現在数初期値０個にする
        int genzaisu = 0;
        //cartに同じ商品があれば数を追加する
        Optional<Cart> currentcart = cartrepo.findById(code);
        
        if(!currentcart.isEmpty()) {
            //cartに同じ商品があれば数を追加する
            //現在数を取り出す
            genzaisu = currentcart.get().getCount();
        }
        
        //カートに一つ追加する

        
        //カートにデータを保存

        
        //cartの内容を取得する
        List<ItemCountDto> cartList = itemrepository.findItemInCart();
        //HTML側でアクセスするためにモデル"cartlist"へ格納
        model.addAttribute("cartlist", cartList);
        //カートを表示する
        return "cart";
    }
    //カートを削除する機能
    @GetMapping("/del/{code}")
    public String cartDel(@PathVariable Integer code,Model model) {
        //カートから対象コードの商品を削除する

        
        //cartの内容を取得する
        List<ItemCountDto> cartList = itemrepository.findItemInCart();
        //HTML側でアクセスするためにモデル"cartlist"へ格納
        model.addAttribute("cartlist", cartList);
        //カートを表示する
        return "cart";
    }
    
    //itemテーブルへのアクセス用リポジトリ
    @Autowired
    ItemRepository itemrepository;
    //cartテーブルへのアクセス用リポジトリ
    @Autowired
    CartRepository cartrepo;

    //トップページへのアクセス
    @GetMapping("/")
    public String showView() {
        return "index";
    }
    
    //リスト表示へのアクセス
    @GetMapping("list")
    public String displayTable(Model model) {
        //itemテーブルの一覧取得
        List<Item> itemList = itemrepository.findAll();
        //thymeleafでアクセスするためにモデル"itemlist"へ格納
        model.addAttribute("itemlist", itemList);
        return "list";
    }
    
    //商品表示へのアクセス
    @GetMapping("cardlist")
    public String displayItemList(Model model) {
        //itemテーブルの一覧取得
        List<Item> itemList = itemrepository.findAll();
        //thymeleafでアクセスするためにモデル"itemlist"へ格納
        model.addAttribute("itemlist", itemList);
        return "cardlist";
    }
    
    @GetMapping("cardlist/{key}")
    public String displaySortItemList(@PathVariable Integer key,Model model) {
        //
        List<Item> itemList;
        switch(key) {
        case 1:
            itemList = itemrepository.findItemSortByPrice();
            break;
        case 2:
            itemList = itemrepository.findItemSortByCategory();
            break;
        default:
            itemList = itemrepository.findAll();
        }
        
        //thymeleafでアクセスするためにモデル"itemlist"へ格納
        model.addAttribute("itemlist", itemList);
        return "cardlist";
    }
    
    //ショップについてへのアクセス
    @GetMapping("about")
    public String displayShopInfo(Model model) {
        //ショップについてへのアクセス
        return "about";
    }
    
    //カートの一覧表示
    @GetMapping("cart")
    public String displayCartInfo(Model model) {
        //cartテーブルの一覧取得
        List<ItemCountDto> cartList = itemrepository.findItemInCart();
        //thymeleafでアクセスするためにモデル"cartlist"へ格納
        model.addAttribute("cartlist", cartList);
        return "cart";
    }
    
    @GetMapping("shop")
    public String displayShopping(Model model) {
        //itemテーブルの一覧取得
        List<Item> itemList = itemrepository.findAll();
        //商品一覧表示でthymeleafを使ってアクセスするためにモデル"itemlist"へ格納
        model.addAttribute("itemlist", itemList);
        return "shop";
    }
    

}
