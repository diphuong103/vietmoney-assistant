// backend/src/main/java/com/vietmoney/controller/TravelPlanController.java
package com.vietmoney.controller;

import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.TravelPlanResponse;
import com.vietmoney.service.TravelPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/travel-plans")
@RequiredArgsConstructor
public class TravelPlanController {

    private final TravelPlanService travelPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TravelPlanResponse>>> getMyPlans() {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TravelPlanResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TravelPlanResponse>> create(@RequestBody TravelPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TravelPlanResponse>> update(
            @PathVariable Long id,
            @RequestBody TravelPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        travelPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/ai-suggest")
    public ResponseEntity<ApiResponse<Map<String, Object>>> aiSuggest(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.generateAiItinerary(id)));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(travelPlanService.getSchedule(id)));
    }
}