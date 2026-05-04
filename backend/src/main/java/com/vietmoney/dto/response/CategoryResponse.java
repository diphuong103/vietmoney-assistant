package com.vietmoney.dto.response;

import com.vietmoney.domain.enums.CategoryType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private CategoryType type;
    private String icon;
    private String color;
    private Boolean isDefault;
    private LocalDateTime createdAt;
}