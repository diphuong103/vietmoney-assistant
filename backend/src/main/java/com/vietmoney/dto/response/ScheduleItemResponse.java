// backend/src/main/java/com/vietmoney/dto/response/ScheduleItemResponse.java
package com.vietmoney.dto.response;

import lombok.Data;

@Data
public class ScheduleItemResponse {
    private Long   id;
    private Integer dayNumber;
    private String timeSlot;
    private String location;
    private String description;
    private String estimatedCost;
}