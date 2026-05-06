
package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePriceUnitRequest {

    @NotBlank(message = "Unit name is required")
    private String name;

    private Integer displayOrder;
}