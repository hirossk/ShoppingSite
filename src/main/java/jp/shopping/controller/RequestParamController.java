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
public class RequestParamController {
	//itemテーブルへのアクセス用リポジトリ
	@Autowired
	ItemRepository itemrepository;
	//cartテーブルへのアクセス用リポジトリ
	@Autowired
	CartRepository cartrepository;

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
	@GetMapping("itemlist")
	public String displayItemList(Model model) {
		//itemテーブルの一覧取得
		List<Item> itemList = itemrepository.findAll();
		//thymeleafでアクセスするためにモデル"itemlist"へ格納
		model.addAttribute("itemlist", itemList);
		return "itemlist";
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
	
	@GetMapping("/cart/{code}")
	public String cartIn(@PathVariable Integer code,Model model) {
		Cart cart;
		//cartに同じ商品があれば数を追加する
		Optional<Cart> currentcart = cartrepository.findById(code);
		//cartに同じ商品があれば数を追加する
		if(currentcart.isEmpty()) {
			cart = new Cart(code,1);
		}else {
			cart = new Cart(code,1+currentcart.get().getCount());
		}
		
		cartrepository.save(cart);
		//cartの内容を取得する
		List<ItemCountDto> cartList = itemrepository.findItemInCart();
		//thymeleafでアクセスするためにモデル"cartlist"へ格納
		model.addAttribute("cartlist", cartList);
		return "cart";
	}
}
