package com.vietmoney.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CityResponse {

    private Long id;
    private String name;
    private String normalizedName;
    private String province;
    private Boolean isPopular;
    private String countryName;
}