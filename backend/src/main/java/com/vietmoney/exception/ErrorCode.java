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
    CATEGORY_ALREADY_EXISTS(409, "Danh mục đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_NOT_FOUND(404, "Danh mục không tồn tại", HttpStatus.NOT_FOUND),
    DEFAULT_CATEGORY_CANNOT_DELETE(400, "Không thể xóa danh mục mặc định", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE(400, "Khoảng thời gian không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(400, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_BUDGET_NAME(400, "Tên ngân sách không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_BUDGET_AMOUNT(400, "Số tiền ngân sách không hợp lệ", HttpStatus.BAD_REQUEST),
    TRANSACTION_NOT_FOUND(404, "Giao dịch không tồn tại", HttpStatus.NOT_FOUND),
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
