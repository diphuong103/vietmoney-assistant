
package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePriceCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String icon;

    private String color;

    private Integer displayOrder;
}