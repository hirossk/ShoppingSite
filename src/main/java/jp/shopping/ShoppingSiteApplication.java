package jp.shopping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import jp.shopping.repository.ItemRepository;

@SpringBootApplication
public class ShoppingSiteApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShoppingSiteApplication.class, args)
		.getBean(ShoppingSiteApplication.class).execute();
	}
	@Autowired
	ItemRepository itemrepository;

	private void execute() {

	}
}
