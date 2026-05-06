package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCityRequest {

    @NotNull
    private Long countryId;

    @NotBlank
    private String name;

    @NotBlank
    private String normalizedName;

    private String province;

    private Boolean isPopular;
}