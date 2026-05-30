package com.vietmoney.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleStatusResponse {

    private boolean liked;

    private boolean saved;

    private long likeCount;

    private long saveCount;

    private long commentCount;

    private long shareCount;

    private long viewCount;
}