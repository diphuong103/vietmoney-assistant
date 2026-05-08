package com.vietmoney.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PriceWikiResponse {

    private Long id;

    private String city;

    private String category;

    private String item;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private String unit;

    private String note;
}