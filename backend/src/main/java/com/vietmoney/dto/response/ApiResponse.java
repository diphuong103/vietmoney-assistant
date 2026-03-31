package com.vietmoney.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().code(200).message("Thành công").data(data).build();
    }
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().code(200).message(message).data(data).build();
    }
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder().code(code).message(message).build();
    }
}
