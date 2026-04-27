// THAY TOÀN BỘ file này
package com.vietmoney.dto.response;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScanResultResponse {
    private String denomination;
    private Long   valueVnd;
    private Double confidence;
    private String imageUrl;
    // Thêm các field mới từ Python
    private String  className;
    private String  currencyType;
    private String  authenticity;
    private Boolean isFake;
    private String  warningMessage;
}