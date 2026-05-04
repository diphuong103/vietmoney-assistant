package com.vietmoney.controller;

import com.vietmoney.domain.entity.TouristSpot;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.TouristSpotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourist-spots")
@RequiredArgsConstructor
public class TouristSpotController {

    private final TouristSpotService touristSpotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TouristSpot>>> getSpots() {
        return ResponseEntity.ok(ApiResponse.success(touristSpotService.getTouristSpots()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TouristSpot>> getSpotById(@PathVariable Long id) {
        TouristSpot spot = touristSpotService.getSpotById(id);
        if (spot == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success(spot));
    }
}
