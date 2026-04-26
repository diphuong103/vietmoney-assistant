package com.vietmoney.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Auth
    USER_NOT_FOUND(404, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(409, "Tên đăng nhập hoặc email đã tồn tại", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(401, "Sai tên đăng nhập hoặc mật khẩu", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(401, "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    OTP_INVALID(400, "OTP không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    // Resources
    ARTICLE_NOT_FOUND(404, "Bài viết không tồn tại", HttpStatus.NOT_FOUND),
    BUDGET_NOT_FOUND(404, "Ngân sách không tồn tại", HttpStatus.NOT_FOUND),
    // General
    FORBIDDEN(403, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    INTERNAL_ERROR(500, "Lỗi hệ thống, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Chỉ thêm 2 dòng này vào phần // Resources
    SCAN_NOT_FOUND(404, "Bản ghi scan không tồn tại", HttpStatus.NOT_FOUND),
    PLAN_NOT_FOUND(404, "Kế hoạch du lịch không tồn tại", HttpStatus.NOT_FOUND);



    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}
