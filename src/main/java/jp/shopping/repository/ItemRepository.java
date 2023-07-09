package jp.shopping.repository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import jp.shopping.dto.ItemCountDto;
import jp.shopping.entity.Item;

//テーブル結合用のデータオブジェクト
@EnableJpaRepositories
public interface ItemRepository extends JpaRepository<Item, Integer> {

    @Query(
            value ="SELECT item.code as code, item.name, cart.count , item.price, item.image " +
                    "FROM item " +
                    "INNER JOIN cart ON (item.code = cart.code)",
            nativeQuery = true
    )
    List<Object[]> findItemPricesRaw();

    default List<ItemCountDto> findItemInCart(){
        return findItemPricesRaw()
                .stream()
                .map(ItemCountDto::new)
                .collect(Collectors.toList());
    }
}

