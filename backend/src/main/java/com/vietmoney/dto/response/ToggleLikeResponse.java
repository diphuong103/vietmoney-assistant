package com.vietmoney.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleLikeResponse {

    private boolean liked;

    private long likeCount;
}