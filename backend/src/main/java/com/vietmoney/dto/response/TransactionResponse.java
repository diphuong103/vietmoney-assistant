package com.vietmoney.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    private String type;
    private BigDecimal amount;
    private String note;

    private LocalDateTime createdAt;
}