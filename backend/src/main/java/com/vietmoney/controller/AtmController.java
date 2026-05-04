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

@RestController
@RequestMapping("/api/v1/atm")
@RequiredArgsConstructor
public class AtmController {

    private final AtmService atmService;

    /**
     * Tìm ATM lân cận — truyền username (nullable) để per-user cooldown hoạt động.
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<?>>> getNearbyAtms(
            @RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "10000") int radius,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(atmService.getNearbyAtms(lat, lng, radius, username)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getAtmById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getAtmById(id)));
    }

    /**
     * Proxy Goong Direction API — giữ API key an toàn tại backend
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
     * Autocomplete tìm kiếm địa điểm (ATM / Ngân hàng)
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
     * Lấy chi tiết vị trí (lat/lng) của một placeId — gọi khi user click ATM
     */
    @GetMapping("/place-detail")
    public ResponseEntity<ApiResponse<Object>> getPlaceDetail(@RequestParam String placeId) {
        return ResponseEntity.ok(ApiResponse.success(atmService.getPlaceDetail(placeId)));
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
    public ResponseEntity<?> getSavedAtms(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }
        return ResponseEntity.ok(
                ApiResponse.success(atmService.getSavedAtms(userDetails.getUsername())));
    }
}
