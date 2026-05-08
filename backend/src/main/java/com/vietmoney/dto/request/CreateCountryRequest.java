package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCountryRequest {

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String currencyCode;
}