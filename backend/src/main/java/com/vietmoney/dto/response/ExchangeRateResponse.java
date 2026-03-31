package com.vietmoney.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExchangeRateResponse {
    private String baseCurrency;
    private Map<String, BigDecimal> rates;
    private LocalDateTime updatedAt;
}
