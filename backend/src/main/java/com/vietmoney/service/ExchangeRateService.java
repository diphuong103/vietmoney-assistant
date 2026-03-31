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
        // Implement currency conversion logic
        return amount;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void syncExchangeRates() {
        try {
            log.info("Syncing exchange rates...");
            // Call external API and update cachedRates
            lastUpdated = LocalDateTime.now();
            // Push to WebSocket subscribers
            messagingTemplate.convertAndSend("/topic/exchange-rates", getCurrentRates());
        } catch (Exception e) {
            log.error("Failed to sync exchange rates", e);
        }
    }
}
