package com.vietmoney.dto.request;

import lombok.Data;

@Data
public class VerifyRegisterRequest {
    private String email;
    private String otp;
}