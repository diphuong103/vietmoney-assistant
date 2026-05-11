// backend/src/main/java/com/vietmoney/controller/ScheduleItemController.java
package com.vietmoney.controller;

import com.vietmoney.dto.request.ScheduleItemRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.ScheduleItemResponse;
import com.vietmoney.service.ScheduleItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/travel-plans/{planId}/schedule-items")
@RequiredArgsConstructor
public class ScheduleItemController {

    private final ScheduleItemService scheduleItemService;

    // POST /api/v1/travel-plans/{planId}/schedule-items
    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> addItem(
            @PathVariable Long planId,
            @Valid @RequestBody ScheduleItemRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(scheduleItemService.addItem(planId, request))
        );
    }

    // PUT /api/v1/travel-plans/{planId}/schedule-items/{itemId}
    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> updateItem(
            @PathVariable Long planId,
            @PathVariable Long itemId,
            @Valid @RequestBody ScheduleItemRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(scheduleItemService.updateItem(planId, itemId, request))
        );
    }

    // DELETE /api/v1/travel-plans/{planId}/schedule-items/{itemId}
    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable Long planId,
            @PathVariable Long itemId) {
        scheduleItemService.deleteItem(planId, itemId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}