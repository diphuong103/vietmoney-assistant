package com.vietmoney.dto.request;

import com.vietmoney.domain.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Category type is required")
    private CategoryType type;

    @Size(max = 50)
    private String icon;

    @Size(max = 20)
    private String color;
}