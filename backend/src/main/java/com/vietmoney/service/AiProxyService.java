package com.vietmoney.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vietmoney.dto.response.ScanResultResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiProxyService {

    private final RestTemplate restTemplate;

    // application.yml: app.ai-service.url=http://localhost:8001
    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    // ─── DTO map từ Python response ─────────────────────────────────────────
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PythonPredictResponse {
        private String denomination;       // "₫100,000"
        private Long valueVnd;             // 100000  (null nếu không phải VND)
        private Double confidence;
        private String imageUrl;
        private String className;          // "VN_100000"
        private String currencyType;       // "VND"
        private String authenticity;       // "real" | "fake"
        private Boolean isFake;
        private String warningMessage;

        @JsonProperty("currencyType")
        public void setCurrencyType(String v) { this.currencyType = v; }
    }

    // ─── Gọi Python FastAPI POST /recognize ─────────────────────────────────
    public ScanResultResponse recognizeCurrency(MultipartFile image) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // Field name phải là "image" — khớp với FastAPI: image: UploadFile = File(...)
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new ByteArrayResource(image.getBytes()) {
            @Override
            public String getFilename() {
                return image.getOriginalFilename() != null
                        ? image.getOriginalFilename() : "scan.jpg";
            }
        });

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // Python app.include_router(recognize.router, prefix="/recognize")
        // → endpoint là POST http://localhost:8001/recognize
        String url = aiServiceUrl + "/recognize";
        log.info("Calling AI service: {}", url);

        try {
            ResponseEntity<PythonPredictResponse> response = restTemplate.postForEntity(
                    url, request, PythonPredictResponse.class
            );

            PythonPredictResponse python = response.getBody();
            if (python == null) {
                throw new RuntimeException("AI service trả về response rỗng");
            }

            log.info("AI result: class={} conf={} fake={}",
                    python.getClassName(), python.getConfidence(), python.getIsFake());

            return ScanResultResponse.builder()
                    .denomination(python.getDenomination())
                    .valueVnd(python.getValueVnd())
                    .confidence(python.getConfidence())
                    .imageUrl(python.getImageUrl())
                    .className(python.getClassName())
                    .currencyType(python.getCurrencyType())
                    .authenticity(python.getAuthenticity())
                    .isFake(Boolean.TRUE.equals(python.getIsFake()))
                    .warningMessage(python.getWarningMessage())
                    .build();

        } catch (Exception e) {
            log.error("Lỗi gọi AI service: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối AI service: " + e.getMessage(), e);
        }
    }
}