package com.vietmoney.controller;

import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.AtmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atm")
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
}
