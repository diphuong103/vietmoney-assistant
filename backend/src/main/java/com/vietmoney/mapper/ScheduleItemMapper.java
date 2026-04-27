package com.vietmoney.mapper;

import com.vietmoney.domain.entity.ScheduleItem;
import com.vietmoney.dto.response.ScheduleItemResponse;
import org.springframework.stereotype.Component;

@Component
public class ScheduleItemMapper {
    public ScheduleItemResponse toResponse(ScheduleItem item) {
        ScheduleItemResponse res = new ScheduleItemResponse();
        res.setId(item.getId());
        res.setDayNumber(item.getDayNumber());
        res.setTimeSlot(item.getTimeSlot());
        res.setLocation(item.getLocation());
        res.setDescription(item.getDescription());
        res.setEstimatedCost(item.getEstimatedCost());
        return res;
    }
}