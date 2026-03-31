package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank private String email;
    @NotBlank private String otp;
    @NotBlank private String newPassword;
}
