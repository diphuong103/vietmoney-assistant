package com.vietmoney.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponse {

    private boolean following;

    private long followerCount;
}