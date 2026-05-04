package com.vietmoney.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ================= AUTH =================
    USER_NOT_FOUND(404, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(409, "Tên đăng nhập hoặc email đã tồn tại", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(401, "Sai tên đăng nhập hoặc mật khẩu", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(401, "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    OTP_INVALID(400, "OTP không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),

    // ================= RESOURCES =================
    ARTICLE_NOT_FOUND(404, "Bài viết không tồn tại", HttpStatus.NOT_FOUND),
    BUDGET_NOT_FOUND(404, "Ngân sách không tồn tại", HttpStatus.NOT_FOUND),
    TRANSACTION_NOT_FOUND(404, "Giao dịch không tồn tại", HttpStatus.NOT_FOUND),
    DAILY_BUDGET_NOT_FOUND(404, "Ngân sách ngày không tồn tại", HttpStatus.NOT_FOUND),

    // ================= CATEGORY =================
    CATEGORY_NOT_FOUND(404, "Category không tồn tại", HttpStatus.NOT_FOUND),
    CATEGORY_ALREADY_EXISTS(400, "Category đã tồn tại", HttpStatus.BAD_REQUEST),
    DEFAULT_CATEGORY_CANNOT_DELETE(400, "Không thể xóa category mặc định", HttpStatus.BAD_REQUEST),

    // ================= BUDGET VALIDATION =================
    INVALID_BUDGET_NAME(400, "Tên ngân sách không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_BUDGET_AMOUNT(400, "Số tiền ngân sách không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE(400, "Khoảng thời gian ngân sách không hợp lệ", HttpStatus.BAD_REQUEST),

    // ================= VALIDATION =================
    INVALID_REQUEST(400, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT(400, "Số tiền không hợp lệ", HttpStatus.BAD_REQUEST),

    // ================= PERMISSION =================
    FORBIDDEN(403, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),

    // ================= GENERAL =================
    INTERNAL_ERROR(500, "Lỗi hệ thống, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}