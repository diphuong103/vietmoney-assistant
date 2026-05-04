package com.vietmoney.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class BudgetResponse {
    private Long id;
    private String name;
    private BigDecimal totalAmount;
    private BigDecimal spentAmount;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double percentUsed;
}