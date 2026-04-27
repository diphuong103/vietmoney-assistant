package com.vietmoney.service;

import com.vietmoney.domain.entity.ScheduleItem;
import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.ScheduleItemResponse;
import com.vietmoney.dto.response.TravelPlanResponse;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.exception.ResourceNotFoundException;
import com.vietmoney.mapper.ScheduleItemMapper;
import com.vietmoney.mapper.TravelPlanMapper;
import com.vietmoney.repository.ScheduleItemRepository;
import com.vietmoney.repository.TravelPlanRepository;
import com.vietmoney.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelPlanService {

    private final TravelPlanRepository travelPlanRepository;
    private final UserRepository userRepository;
    private final TravelPlanMapper travelPlanMapper;
    private final ScheduleItemRepository scheduleItemRepository;
    private final ScheduleItemMapper scheduleItemMapper;
    private final GeminiService geminiService;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
    }

    public List<TravelPlanResponse> getAll() {
        User user = getCurrentUser();
        return travelPlanRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(travelPlanMapper::toResponse).toList();
    }

    public TravelPlanResponse getById(Long id) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));
        return travelPlanMapper.toResponse(plan);
    }

    public TravelPlanResponse create(TravelPlanRequest request) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanMapper.toEntity(request);
        plan.setUser(user);
        return travelPlanMapper.toResponse(travelPlanRepository.save(plan));
    }

    public TravelPlanResponse update(Long id, TravelPlanRequest request) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));
        travelPlanMapper.updateEntity(request, plan);
        return travelPlanMapper.toResponse(travelPlanRepository.save(plan));
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));
        travelPlanRepository.delete(plan);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AI Itinerary — đọc format chuẩn hoá từ GeminiService:
    // {
    //   "summary": "...",
    //   "totalEstimatedCost": "...",
    //   "itinerary": {
    //     "1": [{"time","location","activity","cost"}, ...],
    //     "2": [...],
    //     ...
    //   }
    // }
    // ─────────────────────────────────────────────────────────────────────
    @Transactional
    public Map<String, Object> generateAiItinerary(Long planId) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanRepository.findByIdAndUser(planId, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));

        // Gọi Gemini (luôn trả về map, không bao giờ throw)
        Map<String, Object> aiResult = geminiService.generateTravelItinerary(
                plan.getDestination(),
                plan.getBudget(),
                plan.getNumberOfPeople() != null ? plan.getNumberOfPeople() : 1,
                plan.getStartDate()  != null ? plan.getStartDate().toString()  : null,
                plan.getEndDate()    != null ? plan.getEndDate().toString()    : null,
                plan.getCurrency()   != null ? plan.getCurrency()              : "VND"
        );

        String summary   = (String) aiResult.getOrDefault("summary", "");
        String totalCost = (String) aiResult.getOrDefault("totalEstimatedCost", "");

        // ── Đọc itinerary map: {"1": [...], "2": [...]} ───────────────
        @SuppressWarnings("unchecked")
        Map<String, Object> itinerary =
                (Map<String, Object>) aiResult.get("itinerary");

        // Xóa schedule cũ
        scheduleItemRepository.deleteAllByTravelPlan(plan);

        List<ScheduleItem> toSave = new ArrayList<>();

        if (itinerary != null && !itinerary.isEmpty()) {
            // Sắp xếp theo số ngày tăng dần
            itinerary.entrySet().stream()
                    .sorted(Comparator.comparingInt(e -> {
                        try { return Integer.parseInt(e.getKey()); }
                        catch (NumberFormatException ex) { return 0; }
                    }))
                    .forEach(entry -> {
                        int dayNumber;
                        try { dayNumber = Integer.parseInt(entry.getKey()); }
                        catch (NumberFormatException ex) {
                            log.warn("Skip invalid day key: {}", entry.getKey());
                            return;
                        }

                        if (!(entry.getValue() instanceof List<?> items)) {
                            log.warn("Day {} items không phải List, bỏ qua.", dayNumber);
                            return;
                        }

                        for (Object itemObj : items) {
                            if (!(itemObj instanceof Map<?, ?> item)) continue;

                            // GeminiService đã chuẩn hoá field names:
                            // time, location, activity, cost
                            toSave.add(ScheduleItem.builder()
                                    .travelPlan(plan)
                                    .dayNumber(dayNumber)
                                    .timeSlot(safeString(item, "time"))
                                    .location(safeString(item, "location"))
                                    .description(safeString(item, "activity"))
                                    .estimatedCost(safeString(item, "cost"))
                                    .build());
                        }
                    });
        } else {
            log.warn("Itinerary rỗng cho planId={}, không lưu schedule.", planId);
        }

        scheduleItemRepository.saveAll(toSave);
        log.info("Saved {} schedule items for planId={}", toSave.size(), planId);

        // Group theo dayNumber để frontend render ngay mà không cần gọi thêm API
        Map<Integer, List<ScheduleItemResponse>> scheduleByDay = new LinkedHashMap<>();
        for (ScheduleItem item : toSave) {
            scheduleByDay
                    .computeIfAbsent(item.getDayNumber(), k -> new ArrayList<>())
                    .add(scheduleItemMapper.toResponse(item));
        }

        return Map.of(
                "summary",            summary,
                "totalEstimatedCost", totalCost,
                "itinerary",          scheduleByDay  // frontend dùng key "itinerary"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Lấy schedule đã lưu của 1 plan
    // ─────────────────────────────────────────────────────────────────────
    public Map<String, Object> getSchedule(Long planId) {
        User user = getCurrentUser();
        TravelPlan plan = travelPlanRepository.findByIdAndUser(planId, user)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PLAN_NOT_FOUND));

        List<ScheduleItemResponse> items = scheduleItemRepository
                .findByTravelPlanOrderByDayNumberAscTimeSlotAsc(plan)
                .stream().map(scheduleItemMapper::toResponse).toList();

        Map<Integer, List<ScheduleItemResponse>> grouped = new LinkedHashMap<>();
        for (ScheduleItemResponse item : items) {
            grouped.computeIfAbsent(item.getDayNumber(), k -> new ArrayList<>()).add(item);
        }

        return Map.of("scheduleByDay", grouped);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helper: đọc string an toàn từ Map (tránh ClassCastException)
    // ─────────────────────────────────────────────────────────────────────
    private String safeString(Map<?, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }
}