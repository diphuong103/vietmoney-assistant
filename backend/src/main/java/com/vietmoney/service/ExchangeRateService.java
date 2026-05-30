package com.vietmoney.service;

import com.vietmoney.dto.response.ExchangeRateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
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

    // Fallback rates (VND base) — dùng khi API hết quota
    private static final Map<String, BigDecimal> FALLBACK_RATES = Map.of(
            "USD", new BigDecimal("0.000040"),
            "EUR", new BigDecimal("0.000037"),
            "JPY", new BigDecimal("0.0060"),
            "KRW", new BigDecimal("0.054"),
            "SGD", new BigDecimal("0.000054"),
            "THB", new BigDecimal("0.0014"),
            "VND", BigDecimal.ONE
    );

    public ExchangeRateResponse getCurrentRates() {
        Map<String, BigDecimal> rates = cachedRates.isEmpty() ? FALLBACK_RATES : cachedRates;
        return ExchangeRateResponse.builder()
                .baseCurrency("VND")
                .rates(rates)
                .updatedAt(lastUpdated)
                .build();
    }

    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        Map<String, BigDecimal> rates = cachedRates.isEmpty() ? FALLBACK_RATES : cachedRates;
        BigDecimal fromRate = rates.getOrDefault(fromCurrency.toUpperCase(), BigDecimal.ONE);
        BigDecimal toRate   = rates.getOrDefault(toCurrency.toUpperCase(),   BigDecimal.ONE);
        if (fromRate.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        // amount (fromCurrency) → VND → toCurrency
        return amount.divide(fromRate, 8, java.math.RoundingMode.HALF_UP)
                .multiply(toRate)
                .setScale(4, java.math.RoundingMode.HALF_UP);
    }

    // Tăng lên 1 giờ để tránh hết quota free plan (1500 req/month ≈ 2 req/giờ)
    @Scheduled(fixedRate = 3_600_000)
    public void syncExchangeRates() {
        try {
            log.info("Syncing exchange rates...");
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(apiUrl, Map.class);

            if (response == null) {
                log.warn("Exchange rate API returned null response");
                return;
            }

            // exchangerate-api.com trả về field "conversion_rates" hoặc "rates"
            Map<String, Number> rates = null;
            if (response.containsKey("conversion_rates")) {
                //noinspection unchecked
                rates = (Map<String, Number>) response.get("conversion_rates");
            } else if (response.containsKey("rates")) {
                //noinspection unchecked
                rates = (Map<String, Number>) response.get("rates");
            }

            if (rates != null) {
                rates.forEach((k, v) ->
                        cachedRates.put(k.toUpperCase(), BigDecimal.valueOf(v.doubleValue()))
                );
                lastUpdated = LocalDateTime.now();
                log.info("Exchange rates synced successfully. {} currencies cached.", cachedRates.size());
                messagingTemplate.convertAndSend("/topic/exchange-rates", getCurrentRates());
            } else {
                log.warn("Exchange rate API response missing 'rates'/'conversion_rates': {}", response);
            }

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Exchange rate API quota reached. Using cached/fallback rates.");
        } catch (HttpClientErrorException e) {
            log.error("Exchange rate API HTTP error {}: {}", e.getStatusCode(), e.getMessage());
        } catch (Exception e) {
            log.error("Failed to sync exchange rates: {}", e.getMessage());
        }
    }
}