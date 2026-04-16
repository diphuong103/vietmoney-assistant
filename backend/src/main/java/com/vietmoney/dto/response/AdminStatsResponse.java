package com.vietmoney.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalArticles;
    private long pendingArticles;
    private long totalScansToday;
}
