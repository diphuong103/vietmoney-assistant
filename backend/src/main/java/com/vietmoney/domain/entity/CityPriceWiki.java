
package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "city_price_wikis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityPriceWiki {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String item;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;


    private String note;

    // ================= NORMALIZED RELATION =================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private PriceCategory categoryRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private PriceUnit unitRef;
}