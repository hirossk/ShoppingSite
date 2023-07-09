package jp.shopping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import jp.shopping.entity.Cart;

@EnableJpaRepositories
public interface CartRepository extends JpaRepository<Cart, Integer> {

}

