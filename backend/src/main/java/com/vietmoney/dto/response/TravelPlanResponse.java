// backend/src/main/java/com/vietmoney/dto/response/TravelPlanResponse.java
package com.vietmoney.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TravelPlanResponse {
    private Long id;
    private String title;
    private String destination;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String budget;
    private Object itinerary;

    private String currency;
    private Integer numberOfPeople;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}