# Cập Nhật Mã Nguồn – Hoàn Thiện Chức Năng Admin

> **Ngày cập nhật:** 16/04/2026  
> **Phạm vi:** Backend (Spring Boot) + Frontend (React/Vite)

---

## 1. Backend – Thêm Endpoint Thống Kê Admin

### [MỚI] `AdminStatsResponse.java`
- **Đường dẫn:** `backend/src/main/java/com/vietmoney/dto/response/AdminStatsResponse.java`
- DTO trả về 4 chỉ số: `totalUsers`, `totalArticles`, `pendingArticles`, `totalScansToday`

### [SỬA] `AdminController.java`
- **Đường dẫn:** `backend/src/main/java/com/vietmoney/controller/AdminController.java`
- Thêm endpoint `GET /api/admin/stats` – truy vấn trực tiếp các Repository để đếm tổng users, articles, pending articles, scans trong ngày
- Inject thêm `UserRepository`, `ArticleRepository`, `ScanHistoryRepository`

### [SỬA] `ArticleRepository.java`
- **Đường dẫn:** `backend/src/main/java/com/vietmoney/repository/ArticleRepository.java`
- Thêm method `long countByStatus(ArticleStatus status)` – đếm bài viết theo trạng thái

### [SỬA] `ScanHistoryRepository.java`
- **Đường dẫn:** `backend/src/main/java/com/vietmoney/repository/ScanHistoryRepository.java`
- Thêm method `long countByScannedAtAfter(LocalDateTime dateTime)` – đếm số lần scan từ một thời điểm

---

## 2. Frontend – Cập Nhật API Layer

### [SỬA] `adminApi.js`
- **Đường dẫn:** `frontend/src/api/adminApi.js`
- Fix URL patterns cho khớp với backend endpoints
- `updateUserRole(id, role)` – gửi `role` qua query param thay vì body (khớp với `@RequestParam` backend)
- Thêm các methods mới:
  - `getStats()` → `GET /admin/stats`
  - `getPendingArticles(params)` → `GET /admin/articles/pending`
  - `approveArticle(id)` → `PUT /articles/admin/{id}/approve`
  - `rejectArticle(id, reason)` → `PUT /articles/admin/{id}/reject`
  - `deleteArticle(id)` → `DELETE /articles/{id}`

---

## 3. Frontend – Trang Admin Dashboard

### [SỬA] `AdminDashboardPage.jsx`
- **Đường dẫn:** `frontend/src/pages/admin/AdminDashboardPage.jsx`
- **Trước:** Hiển thị 4 stat cards với dữ liệu cứng (hardcoded)
- **Sau:**
  - Gọi `adminApi.getStats()` + `adminApi.getPendingArticles()` khi mount
  - Hiển thị **Loading spinner** khi đang tải
  - Hiển thị **Error state** với nút "Thử lại" khi API lỗi
  - **4 stat cards** với dữ liệu thực từ backend
  - **Quick Actions** – nút điều hướng nhanh tới Article Approval và User Management
  - **Bài viết chờ duyệt gần đây** – hiển thị 5 bài pending mới nhất

---

## 4. Frontend – Trang Quản Lý Bài Viết

### [SỬA] `ArticleApprovalPage.jsx`
- **Đường dẫn:** `frontend/src/pages/admin/ArticleApprovalPage.jsx`
- **Trước:** 3 bài viết mock, approve/reject chỉ thay đổi local state
- **Sau:**
  - Gọi `adminApi.getPendingArticles()` với pagination (server-side)
  - **Tab filter:** Chờ duyệt / Đã duyệt / Từ chối
  - **Search:** Tìm kiếm theo tiêu đề bài viết
  - **Approve:** Gọi `adminApi.approveArticle(id)` với toast thông báo
  - **Reject Modal:** Popup nhập lý do từ chối trước khi gọi `adminApi.rejectArticle(id, reason)`
  - **Delete Modal:** Popup xác nhận trước khi xoá, hiển thị tên bài viết
  - Loading/Empty/Error states đầy đủ
  - `Pagination` component với server-side paging

---

## 5. Frontend – Trang Quản Lý Người Dùng

### [SỬA] `UserManagementPage.jsx`
- **Đường dẫn:** `frontend/src/pages/admin/UserManagementPage.jsx`
- **Trước:** 12 users mock, chỉ hiển thị bảng tĩnh
- **Sau:**
  - Gọi `adminApi.getUsers()` với pagination
  - **Search:** Tìm theo tên, email, username (client-side filter)
  - **Bảng users** với các cột: Avatar + Tên, Email, Quyền (badge), Trạng thái (Active/Disabled + Email verified), Ngày tham gia, Thao tác
  - **Role Change Modal:** Xác nhận trước khi đổi quyền (ADMIN ↔ CLIENT)
  - **Delete Modal:** Xác nhận trước khi xoá người dùng
  - Loading spinner cho từng action riêng biệt
  - Toast thông báo sau mỗi thao tác

---

## 6. Frontend – Layout & Components

### [SỬA] `AdminLayout.jsx`
- **Đường dẫn:** `frontend/src/components/layout/AdminLayout.jsx`
- Thêm **Admin info card** hiển thị avatar + tên + role ở sidebar
- Thêm nút **"Về trang chủ"** và **"Đăng xuất"** ở bottom sidebar
- **Responsive sidebar:** Trên mobile (< 768px) sidebar ẩn, hiển thị hamburger menu
- Label tiếng Việt cho navigation items

### [SỬA] `Modal.jsx`
- **Đường dẫn:** `frontend/src/components/common/Modal.jsx`
- Thêm `alignItems: 'center'` cho modal overlay – các confirmation modal hiển thị ở giữa màn hình thay vì dính dưới cùng

---

## 7. Kiểm Tra

| Hạng mục | Kết quả |
|----------|---------|
| `vite build` | ✅ Thành công (0 errors, 0 warnings) |
| Thời gian build | 1.46s |
| Tổng modules | 192 |

> **Lưu ý:** Để test API integration đầy đủ, cần chạy Spring Boot backend (`mvn spring-boot:run`). Frontend đã có error handling gracefully khi backend chưa sẵn sàng.
