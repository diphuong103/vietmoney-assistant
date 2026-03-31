package com.vietmoney.dto.request;

import com.vietmoney.domain.enums.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransactionRequest {
    private Long budgetId;
    @NotNull private TransactionType type;
    @NotNull @Positive private BigDecimal amount;
    @NotBlank private String currency;
    private String category;
    private String note;
    private String imageUrl;
}
