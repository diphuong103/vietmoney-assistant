package com.vietmoney.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BudgetRequest {
    private String name;
    private BigDecimal totalAmount;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
}