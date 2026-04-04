# Tóm Tắt Thay Đổi & Các Hạng Mục Cần Fix (Technical Debt)

Tài liệu này ghi lại những thay đổi tạm thời đã thực hiện để phục vụ quá trình Local Development (không dùng Docker) và danh sách các hạng mục cần thực hiện / hoàn trả tĩnh khi tiến hành đưa dự án lên kiểm thử thực tế hoặc Production.

## 1. Các Thay Đổi Đã Thực Hiện (Changelogs)

* **Hạ Tầng & Database**:
  * Chuyển đổi Database từ MySQL sang **H2 In-memory** (chỉnh sửa `application-dev.yml` và `pom.xml`). Điều này giúp dự án khởi chạy trực tiếp mà không cần cài đặt CSDL thực.
  * Tắt bộ đệm Redis và cấu hình lại `OtpService`. Các OTP và logic Verification hiện tại đang được lưu trong `ConcurrentHashMap` trên RAM thay vì Redis.

* **Fix lỗi Build & Lombok**:
  * Cập nhật `maven-compiler-plugin` cùng `mapstruct-processor` và `lombok-mapstruct-binding` vào `pom.xml` giúp IDE/Maven build không bị rớt các hàm Setter/Getter/Builder tự sinh.

* **Hoàn Thiện Dữ Liệu Các Dịch Vụ**:
  * Viết đầy đủ Logic cho `ScanController` và `ScanService` (Lấy dữ liệu History - Xóa).
  * Viết đầy đủ Logic Controller cho `Article` (Like - Delete).
  * Viết API lấy/cấu hình định mức chi tiêu `BudgetService` bằng các endpoint liên quan đến `/api/budget/daily`.
  * Thay thế các logic rỗng (Dummy) trong `UserService`, `AdminController`, `ExchangeRateService`, `TouristSpotService` và `WikiPriceService` thành các logic gọi qua Repository thực tế cũng như Mock dữ liệu hợp lý.

* **Fix Các Lỗi Khởi Tạo & Runtime Lặp Lại**:
  * **API (UnsatisfiedDependencyException + IllegalArgumentException)**: Bổ sung cấu hình `app.ai-service.url` và `app.exchange-rate.api-url` vào `application.yml` giúp tiến trình giải quyết placeholder của cấu hình chạy thành công, giải quyết triệt để lỗi không thể inject Bean `ExchangeRateService` và `AiProxyService`.
  * **Mail (UnsatisfiedDependencyException)**: Lỗi từ AutoConfiguration Mail đã được làm sạch đi kèm với Context Load do các config SMTP được định nghĩa chính xác và Bean `JavaMailSender` inject thẳng tới `OtpService` không còn bị crash.
  * **JWT (IllegalArgumentException)**: Sửa đổi class `JwtAuthFilter` bằng cách bao bọc xử lý lấy `extractUsername` thông qua `try-catch`, nhằm chặn và nuốt lỗi parse JWT của JJWT (`IllegalArgumentException`, `ExpiredJwtException`) khi xử lý chuỗi rỗng/chưa có chữ ký, tránh lỗi Internal Server Error 500.

---

## 2. Các Hạng Mục Cần Fix Ở Phiên Bản Hoàn Thiện (Pending Fixes)

Việc chạy Local chỉ là bước khởi đầu. Để nền tảng ổn định, bạn cần giải quyết các Technical Debt sau trước khi Release:

### 🔴 Ưu tiên cao (Môi trường & Bảo mật)
- [ ] **Hoàn trả MySQL**: Khi build production, hãy đổi cấu hình trong thư mục `resources` sang sử dụng DB MySQL. Cần cấu hình URL, Username, Password trỏ về Container Docker hoặc Managed Database của bạn. (Lưu ý: H2 lưu in-memory sẽ mất sach dữ liệu sau khi tắt ứng dụng).
- [ ] **Bật lại Redis cho Security**: Đổi logic trong `OtpService.java` từ việc sử dụng `ConcurrentHashMap` sang `StringRedisTemplate` (Redis). Cấu hình TTL (Time To Live) cho OTP ở phía Redis để các mã xác nhận tự hết hạn theo chuẩn bảo mật.
- [ ] **Kiểm tra JWT Token Expiry**: Giữ cấu hình thiết lập ngày hết hạn/thời hạn refresh token thích hợp trong config.

### 🟡 Ưu tiên trung bình (Business Logic)
- [ ] **Phát triển thuật toán Google Places API cho `AtmService`**: Hiện tại `getNearbyAtms` đang trả về dữ liệu Mock tĩnh (Techcombank, Vietcombank). Bạn cần phải dùng `RestTemplate` hoặc công cụ khác gọi sang Google Places API với các Query tham số `Lat, Lng` từ Client lên.
- [ ] **Cập nhật Logic `ExchangeRateService`**: Tích hợp Job (`@Scheduled`) gọi đến API lấy tỷ giá thật (exchange-rate api). Nếu tần suất gọi bị khóa (Rate Limit), bạn cần kéo dài thời gian cron expression. 
- [ ] **Mở rộng AdminController**: Thêm kiểm tra cấp quyền (Authorization) chặt chẽ giữa các loại user, không cho user tự do sửa role của admin cấp cao hơn.

### 🟢 Ưu tiên thấp (Frontend & UX)
- [ ] **Xử lý Exception ở Frontend**: Các request bằng Axios (`axiosClient.js`) mới có logic gửi đi, khuyết Global Error Handling để tóm các lỗi (như HTTP 400, 401, 500) và hiển thị ra các Toast UI báo lỗi cho User.
- [ ] **Cập nhật Axios Interceptor**: Xử lý logic gỡ màn hình Load/Spinner sau khi API phản hồi. 
