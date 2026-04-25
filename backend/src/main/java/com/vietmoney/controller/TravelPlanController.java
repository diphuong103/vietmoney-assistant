package com.vietmoney.controller;

import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.TravelPlanResponse;
import com.vietmoney.service.TravelPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/travel-plans")
@RequiredArgsConstructor
public class TravelPlanController {

    private final TravelPlanService travelPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TravelPlanResponse>>> getMyPlans(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                travelPlanService.getUserPlans(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TravelPlanResponse>> createPlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TravelPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch thành công",
                travelPlanService.createPlan(userDetails.getUsername(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TravelPlanResponse>> updatePlan(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TravelPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch thành công",
                travelPlanService.updatePlan(id, userDetails.getUsername(), request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        travelPlanService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch thành công", null));
    }
}
