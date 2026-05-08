package com.vietmoney.dto.request;

import com.vietmoney.domain.enums.CategoryType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionRequest {
    private Long categoryId;
    private Long budgetId;
    private CategoryType type;
    private BigDecimal amount;
    private String note;
}