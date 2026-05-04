package com.vietmoney.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleStatusResponse {
    private boolean liked;
    private boolean saved;
    private long likeCount;
}
