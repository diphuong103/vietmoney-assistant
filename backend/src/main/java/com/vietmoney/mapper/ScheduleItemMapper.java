// backend/src/main/java/com/vietmoney/mapper/ScheduleItemMapper.java
package com.vietmoney.mapper;

import com.vietmoney.domain.entity.ScheduleItem;
import com.vietmoney.dto.response.ScheduleItemResponse;
import org.springframework.stereotype.Component;

@Component
public class ScheduleItemMapper {

    public ScheduleItemResponse toResponse(ScheduleItem entity) {
        ScheduleItemResponse r = new ScheduleItemResponse();
        r.setId(entity.getId());
        r.setDayNumber(entity.getDayNumber());
        r.setTimeSlot(entity.getTimeSlot());
        r.setLocation(entity.getLocation());
        r.setDescription(entity.getDescription());
        r.setEstimatedCost(entity.getEstimatedCost());
        return r;
    }
}