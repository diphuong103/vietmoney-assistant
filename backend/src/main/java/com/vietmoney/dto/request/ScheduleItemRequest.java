// backend/src/main/java/com/vietmoney/dto/request/ScheduleItemRequest.java
package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ScheduleItemRequest {

    @NotNull(message = "dayNumber không được để trống")
    @Min(value = 1, message = "dayNumber phải >= 1")
    private Integer dayNumber;

    @NotBlank(message = "timeSlot không được để trống")
    private String timeSlot;      // "08:00"

    @NotBlank(message = "location không được để trống")
    private String location;      // "Hồ Hoàn Kiếm"

    private String description;   // "Dạo bộ quanh hồ, chụp ảnh"

    private String estimatedCost; // "50,000đ"
}