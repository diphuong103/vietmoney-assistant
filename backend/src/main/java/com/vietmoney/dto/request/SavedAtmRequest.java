package com.vietmoney.dto.request;

import lombok.Data;

@Data
public class SavedAtmRequest {
    private Long atmId;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String bankKey;
}
