package jp.shopping.entity;
import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//itemテーブルのエンティティクラス
@Data
@Entity
@Table(name = "item")
@AllArgsConstructor
@NoArgsConstructor
public class Item implements Serializable{
	
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(name = "code")
	private Integer code;
	@Column(name = "name")
	private String name;
	@Column(name = "price")
	private Integer price;
	@Column(name = "image")
	private String image;
	
	
}

