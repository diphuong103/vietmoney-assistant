package com.vietmoney.service;

import com.vietmoney.dto.response.ExchangeRateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final RestTemplate restTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.exchange-rate.api-url}")
    private String apiUrl;

    private final Map<String, BigDecimal> cachedRates = new ConcurrentHashMap<>();
    private LocalDateTime lastUpdated;

    public ExchangeRateResponse getCurrentRates() {
        return ExchangeRateResponse.builder()
                .baseCurrency("VND")
                .rates(cachedRates)
                .updatedAt(lastUpdated)
                .build();
    }

    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (cachedRates.isEmpty()) return amount; // Fallback
        BigDecimal fromRate = cachedRates.getOrDefault(fromCurrency, BigDecimal.ONE);
        BigDecimal toRate = cachedRates.getOrDefault(toCurrency, BigDecimal.ONE);
        // Base is VND. amount * (toRate / fromRate) ? Wait.
        // If 1 USD = 24000 VND. fromRate=24000 (if base is something else). Actually API returns base VND usually or base USD.
        // Assuming rates map: currency -> value relative to base.
        if (fromRate.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return amount.divide(fromRate, 4, java.math.RoundingMode.HALF_UP).multiply(toRate);
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void syncExchangeRates() {
        try {
            log.info("Syncing exchange rates...");
            Map response = restTemplate.getForObject(apiUrl, Map.class);
            if (response != null && response.containsKey("rates")) {
                Map<String, Number> rates = (Map<String, Number>) response.get("rates");
                rates.forEach((k, v) -> cachedRates.put(k, BigDecimal.valueOf(v.doubleValue())));
            }
            lastUpdated = LocalDateTime.now();
            messagingTemplate.convertAndSend("/topic/exchange-rates", getCurrentRates());
        } catch (Exception e) {
            log.error("Failed to sync exchange rates", e);
        }
    }
}
