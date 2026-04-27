package com.vietmoney.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ScheduleItemResponse {
    private Long id;
    private Integer dayNumber;
    private String timeSlot;
    private String location;
    private String description;
    private String estimatedCost;
}