# NHỮNG HẠNG MỤC PHẢI HOÀN THIỆN ĐỂ KẾT NỐI 2 MODULE (FRONTEND & BACKEND)

Danh sách này tổng hợp các Endpoint, Bug, và Logic nghiệp vụ bị thiếu dựa trên sự đối chiếu giữa `frontend/src/api/*.js` và cấu trúc `backend/`.

## 1. Phía Frontend (React)
- **`axiosClient.js`**: `baseURL` đã được fix lại đồng bộ với proxy nhưng cần kiểm tra kĩ biến môi trường `.env` trước khi build Docker (chuyển sang đọc `import.meta.env`).
- **Tích hợp API Frontend vào Pages/Components**: Các hàm gọi API như `scanApi.scan()`, `atmApi.getNearby()` cần được handle try/catch chuẩn và map vào các State (Zustand/UseState) tại thư mục `pages/`.

## 2. Phía Backend (Controllers còn thiếu Endpoint)
Khi đối chiếu với các file API Axios của React, các Controller hiện tại ở Backend **bị khuyết** một số đường dẫn (đang được tạo khung tạm):
- **`ScanController`**: Bị thiếu `GET /api/scan/history` và `DELETE /api/scan/history/{id}` (frontend đang gọi trong `scanApi.js`).
- **`ArticleController`**: Bị thiếu endpoint `POST /api/articles/{id}/like` và `DELETE /api/articles/{id}` (có trong `articleApi.js` nhưng backend chưa xử lý).
- **`AdminController`**: Bị rỗng ruột hoặc thiếu `PATCH /api/admin/users/{id}/role` và `DELETE /api/admin/users/{id}` (gọi từ `adminApi.js`).
- **`BudgetController`**: Các API xử lý Daily Target Budget (`GET /api/budget/daily`, `PUT /api/budget/daily`) chưa có trong Controller.

## 3. Phía Backend (Logic Services rỗng ruột)
Toàn bộ các file trong thư mục `src/main/java/com/vietmoney/service/impl/` đang bị RỖNG cấu trúc bên trong (không Override và không có Code). Bạn cần FIX (viết code tương tác với MySQL qua Repository) cho các file này:

- [ ] **`ArticleServiceImpl.java`**: Implements tìm bài viết theo trạng thái `getApprovedArticles()`, lưu bài viết, cập nhật duyệt bài `approveArticle()`.
- [ ] **`AtmServiceImpl.java`**: Implements tìm ATM xung quanh toạ độ (chưa có Entity `Atm` trong domain, có thể bạn sẽ gọi Google Places API hoặc tạo DB tạm).
- [ ] **`AuthServiceImpl.java`**: Validation User `findByEmail`, sinh/phản hồi mã JWT khi Login và mã hóa mật khẩu lúc Register. Cấu hình bảng `User`.
- [ ] **`BudgetServiceImpl.java`**: Cập nhật/thêm xoá `Transaction` (dòng tiền) bảng `budget`, tính toán lại chi tiêu hằng ngày.
- [ ] **`ExchangeRateServiceImpl.java`**: Gọi `RestTemplate` sang Exchange-rate API, parse JSON và tính toán trả về cho frontend tỉ giá đổi `VND`.
- [ ] **`ScanServiceImpl.java`**: Lưu trữ lịch sử `ScanHistory` xuống DB sau khi đã gọi qua `AiProxyService`.
- [ ] **`TouristSpotServiceImpl` (hoặc `TravelPlan`)**: Lấy danh sách điểm tham quan (Entity `TouristSpot`, `TravelPlan`), gợi ý chuyến đi.
- [ ] **`WikiPriceServiceImpl.java`**: Lấy giá các mặt hàng sinh hoạt (Bảng `CityPriceWiki`).
- [ ] **`UserServiceImpl.java`**: Truy vấn trạng thái, role thành viên, thay đổi mật khẩu vv...

## 4. Thiếu file Models/Entities & Repositories
- Để sửa các Service ở mục 3, bạn cần khai báo các `@Repository` trong folder `repository/` để Spring Boot thao tác DB.
- Các Class DTO chưa mapping đầy đủ các trường (fields) bắt buộc tương ứng vào Entity.

*Lưu ý: System đã tạo ra khung (skeleton interface implementation và cấu trúc rỗng) cho các file `Controller` & `ServiceImpl` bị thiếu để Backend không bị Crash quá trình Build. Nhiệm vụ của bạn là dọn dẹp các chữ TODO và điền Logic thật vào!*
