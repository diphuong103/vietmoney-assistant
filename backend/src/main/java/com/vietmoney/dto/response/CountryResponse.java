package com.vietmoney.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CountryResponse {

    private Long id;
    private String code;
    private String name;
    private String currencyCode;
}