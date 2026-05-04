package com.vietmoney.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScanResultResponse {
    private String denomination;
    private Long valueVnd;
    private Double confidence;
    private String imageUrl;
}
