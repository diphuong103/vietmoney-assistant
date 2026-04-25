package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TravelPlanRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String budget;
    private String currency;
    private Integer numberOfPeople;
    private String itinerary; // JSON string
}
