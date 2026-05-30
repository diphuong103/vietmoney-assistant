package com.vietmoney.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateArticleResponse {

    private Long articleId;

    private String message;
}