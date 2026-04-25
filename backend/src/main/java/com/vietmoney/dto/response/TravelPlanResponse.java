package com.vietmoney.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelPlanResponse {
    private Long id;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String budget;
    private String currency;
    private Integer numberOfPeople;
    private String itinerary; // JSON string
    private LocalDateTime createdAt;
}
