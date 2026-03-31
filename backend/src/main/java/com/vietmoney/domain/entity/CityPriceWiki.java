package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "city_price_wikis")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CityPriceWiki {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String city;
    private String category;   // taxi, food, beer, massage, ticket
    private String item;
    private String minPrice;
    private String maxPrice;
    private String unit;
    private String note;
}
