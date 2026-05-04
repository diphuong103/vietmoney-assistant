package com.vietmoney.controller;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.TravelPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/travel-plans")
@RequiredArgsConstructor
public class TravelPlanController {

    private final TravelPlanService travelPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TravelPlan>>> getMyPlans(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                travelPlanService.getUserPlans(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TravelPlan>> createPlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TravelPlan plan) {
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch thành công",
                travelPlanService.createPlan(userDetails.getUsername(), plan)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        travelPlanService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch thành công", null));
    }
}
