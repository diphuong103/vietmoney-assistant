package com.vietmoney.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tourist-spots")
public class TouristSpotController {

    // TODO: Inject TouristSpotService / TravelPlanService

    @GetMapping
    public ResponseEntity<?> getSpots() {
        // TODO: Return spots
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSpotById(@PathVariable Long id) {
        // TODO: Return spot details
        return ResponseEntity.ok().build();
    }
}
