// backend/src/main/java/com/vietmoney/service/ScheduleItemService.java
package com.vietmoney.service;

import com.vietmoney.domain.entity.ScheduleItem;
import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.ScheduleItemRequest;
import com.vietmoney.dto.response.ScheduleItemResponse;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.exception.ResourceNotFoundException;
import com.vietmoney.mapper.ScheduleItemMapper;
import com.vietmoney.repository.ScheduleItemRepository;
import com.vietmoney.repository.TravelPlanRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleItemService {

    private final ScheduleItemRepository scheduleItemRepository;
    private final TravelPlanRepository   travelPlanRepository;
    private final UserRepository         userRepository;
    private final ScheduleItemMapper     scheduleItemMapper;

    // ── Helper: lấy user hiện tại ────────────────────────────────────────
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
    }

    // ── Helper: lấy plan và kiểm tra ownership ────────────────────────────
    private TravelPlan getPlanForCurrentUser(Long planId) {
        User user = getCurrentUser();
        return travelPlanRepository.findByIdAndUser(planId, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));
    }

    // ── Thêm item mới vào 1 ngày cụ thể ─────────────────────────────────
    public ScheduleItemResponse addItem(Long planId, ScheduleItemRequest request) {
        TravelPlan plan = getPlanForCurrentUser(planId);

        ScheduleItem item = ScheduleItem.builder()
                .travelPlan(plan)
                .dayNumber(request.getDayNumber())
                .timeSlot(request.getTimeSlot())
                .location(request.getLocation())
                .description(request.getDescription())
                .estimatedCost(request.getEstimatedCost())
                .build();

        ScheduleItem saved = scheduleItemRepository.save(item);
        log.info("Added schedule item id={} to planId={} day={}",
                saved.getId(), planId, request.getDayNumber());
        return scheduleItemMapper.toResponse(saved);
    }

    // ── Cập nhật item ─────────────────────────────────────────────────────
    public ScheduleItemResponse updateItem(Long planId, Long itemId, ScheduleItemRequest request) {
        // Verify plan ownership
        getPlanForCurrentUser(planId);

        ScheduleItem item = scheduleItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SCHEDULE_ITEM_NOT_FOUND));

        // Đảm bảo item thuộc đúng plan
        if (!item.getTravelPlan().getId().equals(planId)) {
            throw new ResourceNotFoundException(ErrorCode.SCHEDULE_ITEM_NOT_FOUND);
        }

        item.setDayNumber(request.getDayNumber());
        item.setTimeSlot(request.getTimeSlot());
        item.setLocation(request.getLocation());
        item.setDescription(request.getDescription());
        item.setEstimatedCost(request.getEstimatedCost());

        ScheduleItem saved = scheduleItemRepository.save(item);
        log.info("Updated schedule item id={} planId={}", itemId, planId);
        return scheduleItemMapper.toResponse(saved);
    }

    // ── Xóa item ─────────────────────────────────────────────────────────
    public void deleteItem(Long planId, Long itemId) {
        // Verify plan ownership
        getPlanForCurrentUser(planId);

        ScheduleItem item = scheduleItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SCHEDULE_ITEM_NOT_FOUND));

        if (!item.getTravelPlan().getId().equals(planId)) {
            throw new ResourceNotFoundException(ErrorCode.SCHEDULE_ITEM_NOT_FOUND);
        }

        scheduleItemRepository.delete(item);
        log.info("Deleted schedule item id={} planId={}", itemId, planId);
    }
}