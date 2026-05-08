package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePriceRequest {

    @NotBlank
    private String city;

    @NotBlank
    private String item;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private String note;

    private Long categoryId;
    private Long unitId;
}