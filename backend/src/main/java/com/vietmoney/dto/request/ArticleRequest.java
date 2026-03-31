package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ArticleRequest {
    @NotBlank private String title;
    @NotBlank private String content;
    private String thumbnailUrl;
    private String tags;
}
