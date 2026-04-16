package com.vietmoney.controller;

import com.vietmoney.domain.entity.ScanHistory;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.ScanResultResponse;
import com.vietmoney.service.AiProxyService;
import com.vietmoney.service.ScanService;
import lombok.RequiredArgsConstructor;
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
public class ScanController {

    private final AiProxyService aiProxyService;
    private final ScanService scanService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ScanResultResponse>> scan(
            @RequestParam("image") MultipartFile image) throws Exception {
        ScanResultResponse result = aiProxyService.recognizeCurrency(image);
        return ResponseEntity.ok(ApiResponse.success("Nhận diện thành công", result));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ScanHistory>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ScanHistory> history = scanService.getScanHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(@PathVariable Long id) {
        scanService.deleteScanHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Xoá thành công", null));
    }
}
