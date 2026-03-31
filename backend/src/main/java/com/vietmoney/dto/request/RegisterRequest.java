package com.vietmoney.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Tên đăng nhập không được trống")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Mật khẩu không được trống")
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    private String password;

    @NotBlank @Email(message = "Email không hợp lệ")
    private String email;

    private String fullName;
    private String nationality;
    private String travelDestination;
}
