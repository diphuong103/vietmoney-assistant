package com.vietmoney.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atm")
public class AtmController {

    // TODO: Inject AtmService here

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyAtms(@RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "2000") int radius) {
        // TODO: Call AtmService
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAtmById(@PathVariable Long id) {
        // TODO: Call AtmService
        return ResponseEntity.ok().build();
    }
}
