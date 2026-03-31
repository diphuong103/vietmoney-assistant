package com.vietmoney.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BudgetRequest {
    @NotBlank private String name;
    @NotNull @Positive private BigDecimal totalAmount;
    @NotBlank private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
}
