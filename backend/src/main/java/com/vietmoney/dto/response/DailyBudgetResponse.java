package com.vietmoney.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyBudgetResponse {

    private BigDecimal dailyLimit;
    private BigDecimal spentToday;
    private BigDecimal remaining;
    private double percentUsed;
}