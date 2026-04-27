package com.vietmoney.controller;

import com.vietmoney.domain.entity.ScanHistory;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.ScanResultResponse;
import com.vietmoney.service.AiProxyService;
import com.vietmoney.service.ScanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scan")
@RequiredArgsConstructor
@Slf4j
public class ScanController {

    private final AiProxyService aiProxyService;
    private final ScanService    scanService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ScanResultResponse>> scan(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {

        // Guard: trả 401 rõ ràng thay vì NPE
        if (userDetails == null) {
            // Thành:
            return ResponseEntity.status(401)
                    .body(ApiResponse.error(401, "Vui lòng đăng nhập"));
        }

        log.info("Scan | user={} | file={} | hasImgbb={}",
                userDetails.getUsername(), image.getOriginalFilename(), imageUrl != null);

        ScanResultResponse result = aiProxyService.recognizeCurrency(image);
        result.setImageUrl(imageUrl);

        try {
            scanService.saveScanResult(userDetails.getUsername(), result);
        } catch (Exception e) {
            log.warn("Không lưu scan history: {}", e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success("Nhận diện thành công", result));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ScanHistory>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                scanService.getScanHistoryDto(userDetails.getUsername())));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(@PathVariable Long id) {
        scanService.deleteScanHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Xoá thành công", null));
    }
}