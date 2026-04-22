package com.vietmoney.controller;

import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.AtmService;
import lombok.RequiredArgsConstructor;
import com.vietmoney.dto.request.SavedAtmRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/atm")
@RequiredArgsConstructor
public class AtmController {

    private final AtmService atmService;

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<Object>>> getNearbyAtms(
            @RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "2000") int radius) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getNearbyAtms(lat, lng, radius)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getAtmById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getAtmById(id)));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Object>> saveAtm(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SavedAtmRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu ATM thành công",
                atmService.saveAtm(userDetails.getUsername(), request)));
    }

    @DeleteMapping("/unsave/{atmId}")
    public ResponseEntity<ApiResponse<Void>> unsaveAtm(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long atmId) {
        atmService.unsaveAtm(userDetails.getUsername(), atmId);
        return ResponseEntity.ok(ApiResponse.success("Bỏ lưu thành công", null));
    }

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSavedAtms(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getSavedAtms(userDetails.getUsername())));
    }
}
