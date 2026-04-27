// backend/src/main/java/com/vietmoney/dto/request/TravelPlanRequest.java
package com.vietmoney.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TravelPlanRequest {
    private String title;
    private String destination;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String budget;
    private Object itinerary; // JSON flexible

    private String currency;
    private Integer numberOfPeople;
}