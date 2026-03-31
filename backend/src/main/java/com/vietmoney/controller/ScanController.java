package com.vietmoney.controller;

import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.ScanResultResponse;
import com.vietmoney.service.AiProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/scan")
@RequiredArgsConstructor
public class ScanController {

    private final AiProxyService aiProxyService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ScanResultResponse>> scan(
            @RequestParam("image") MultipartFile image) throws Exception {
        ScanResultResponse result = aiProxyService.recognizeCurrency(image);
        return ResponseEntity.ok(ApiResponse.success("Nhận diện thành công", result));
    }
}
