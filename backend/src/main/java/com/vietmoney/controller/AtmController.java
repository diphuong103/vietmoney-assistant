package com.vietmoney.controller;

import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.AtmService;
import lombok.RequiredArgsConstructor;
import com.vietmoney.dto.request.SavedAtmRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * GET /api/v1/atm/nearby
     *
     * Returns ATMs from DB cache immediately.
     * If the area has not been scanned yet (or TTL expired),
     * an async Goong API scan is triggered in background.
     * The frontend should poll after ~3s if result is empty.
     *
     * Query params:
     *   lat, lng   – user coordinates
     *   radius     – search radius in metres (default 10000)
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<?>>> getNearbyAtms(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10000") int radius,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails != null ? userDetails.getUsername() : null;
        List<Map<String, Object>> results = atmService.getNearbyAtms(lat, lng, radius, username);

        // Include scan coverage metadata in response
        Map<String, Object> coverage = atmService.getCoverageInfo(lat, lng, radius);
        boolean fullyScanned = (int) coverage.getOrDefault("coveragePct", 0) >= 100;

        return ResponseEntity.ok(
                ApiResponse.<List<?>>builder()
                        .code(200)
                        .message(fullyScanned
                                ? "Dữ liệu từ cache"
                                : "Đang quét thêm dữ liệu, vui lòng chờ...")
                        .data(results)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getAtmById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getAtmById(id)));
    }

    /**
     * GET /api/v1/atm/direction
     * Proxy Goong Direction API — keeps API key on server
     */
    @GetMapping("/direction")
    public ResponseEntity<ApiResponse<Object>> getDirection(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "car") String vehicle) {
        return ResponseEntity.ok(ApiResponse.success(
                atmService.getDirection(origin, destination, vehicle)));
    }

    /**
     * GET /api/v1/atm/autocomplete
     * Search suggestions — served from DB when possible, falls back to Goong
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<?>>> getAutocomplete(
            @RequestParam String query,
            @RequestParam(defaultValue = "21.0285") double lat,
            @RequestParam(defaultValue = "105.8542") double lng) {
        return ResponseEntity.ok(ApiResponse.success(
                atmService.searchAutocomplete(query, lat, lng)));
    }

    /**
     * GET /api/v1/atm/place-detail
     * Returns lat/lng for a placeId — checks DB first, calls Goong only on miss
     */
    @GetMapping("/place-detail")
    public ResponseEntity<ApiResponse<Object>> getPlaceDetail(
            @RequestParam String placeId) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getPlaceDetail(placeId)));
    }

    /**
     * GET /api/v1/atm/coverage
     * Returns scan coverage info for a location (useful for debugging / frontend hint)
     */
    @GetMapping("/coverage")
    public ResponseEntity<ApiResponse<Object>> getCoverage(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10000") int radius) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getCoverageInfo(lat, lng, radius)));
    }

    /**
     * POST /api/v1/atm/force-rescan  (admin only)
     * Invalidates scan cache for a location so next request re-scans from Goong API
     */
    @PostMapping("/force-rescan")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> forceRescan(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ResponseEntity.ok(ApiResponse.success(atmService.forceRescan(lat, lng)));
    }

    // ── Saved ATM endpoints ────────────────────────────────────────────────────

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
    public ResponseEntity<?> getSavedAtms(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null)
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        return ResponseEntity.ok(ApiResponse.success(
                atmService.getSavedAtms(userDetails.getUsername())));
    }
}