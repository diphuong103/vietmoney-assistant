# VietMoney Assistant

## 1. Giới thiệu
**VietMoney Assistant** là ứng dụng hỗ trợ tài chính và du lịch toàn diện dành cho du khách quốc tế và người dùng tại Việt Nam. 

**Mục tiêu cốt lõi:**
* Cung cấp giải pháp nhận diện và phân biệt tiền Việt Nam (VNĐ) tự động bằng Trí tuệ Nhân tạo (AI).
* Hỗ trợ người dùng theo dõi chi tiêu, quản lý ngân sách và lên kế hoạch du lịch mượt mà.
* Cung cấp thông tin trực quan về tỷ giá tiền tệ, vị trí ATM và cẩm nang giá cả (Price Wiki) để tránh tình trạng "chặt chém" đối với khách du lịch.
* Chatbot AI hỗ trợ tư vấn du lịch và tài chính.

---

## 2. Công nghệ sử dụng

| Lớp (Layer) | Ngôn ngữ / Công nghệ | Các thư viện / Framework chính |
| :--- | :--- | :--- |
| **Frontend** | JavaScript (Node.js) | React 18, Vite, Tailwind CSS, Zustand, React Query, Leaflet / Goong Maps, React Hook Form |
| **Backend** | Java 21 | Spring Boot 3.2, Spring Security, Hibernate (JPA), JWT, WebSocket, OpenAPI (Swagger), Cloudinary |
| **AI Service** | Python | FastAPI, PyTorch, OpenCV, Pillow |
| **Database** | SQL | MySQL, Flyway (Database Migration) |

---

## 3. Kiến trúc & Cấu trúc thư mục

Dự án được triển khai theo kiến trúc Microservices tinh gọn, bao gồm 3 phân hệ chính giao tiếp với nhau:

```text
vietmoney-assistant/
├── frontend/          # Giao diện người dùng Web (ReactJS + Vite). Xử lý tương tác của User/Admin.
├── backend/           # API chính của hệ thống (Spring Boot) xử lý logic nghiệp vụ, quản lý user, budget,...
├── ai-service/        # Dịch vụ AI (FastAPI Python) chuyên biệt cho việc nhận diện hình ảnh tiền tệ.
├── database/          # Tệp dữ liệu SQL và schema migration.
└── README.md          # Tài liệu tổng quan dự án.
```

---

## 4. Các chức năng chính

Hệ thống cung cấp trải nghiệm chuyên biệt cho 2 nhóm đối tượng:

### Chức năng dành cho người dùng (User / Client)
* **Quét nhận diện tiền tệ (Scan):** Tích hợp Camera đo lường, dùng AI để nhận diện các mệnh giá tiền Việt Nam (Polyme).
* **Lịch sử quét (Scan History):** Xem lại các lần quét mệnh giá tiền trước đó.
* **Quản lý ngân sách (Budget & Transactions):** Theo dõi chi tiêu cá nhân chi tiết theo từng hạng mục.
* **Kế hoạch du lịch (Travel Plan):** Lên kế hoạch điểm đến chuyến đi, quản lý lịch trình một cách thông minh.
* **Bản đồ ATM (ATM Map):** Bản đồ tìm kiếm và chỉ đường tới cây ATM gần nhất thông qua Goong Maps/Leaflet.
* **Tỷ giá & Tiền tệ (Exchange Rate & Currency Guide):** Cập nhật tỷ giá hối đoái liên tục và từ điển hướng dẫn ngoại tệ.
* **Bách khoa giá cả (Price Wiki):** Mạng lưới tra cứu giá cả dịch vụ địa phương do cộng đồng đóng góp.
* **Tin tức(News):** Các bài viết tin tức mới nhất.
* **Chatbot AI:** Hỗ trợ tư vấn du lịch và tài chính
(Các thông tin cố định hoặc realtime liên quan đến du lịch và tài chính).

### Chức năng dành cho quản trị viên (Admin)
* **Bảng điều khiển (Admin Dashboard):** Báo cáo và thống kê tổng quan (Dashboard) số liệu nền tảng.
* **Quản lý người dùng (User Management):** Xem danh sách, phân quyền và khóa các tài khoản vi phạm.
* **Phê duyệt bài viết (Article Approval):** Duyệt kiểm các bài viết, tin tức du lịch, kinh nghiệm trước khi hiển thị.
* **Quản lý Price Wiki (Price Wiki Admin):** Kiểm duyệt giá cả thị trường do cộng đồng đăng tải lên, tránh spam giá sai lệch.

---

## 5. Hướng dẫn cài đặt

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt **Node.js (v18+)**, **Java 21**, **Maven**, **Python (3.10+)** và **MySQL Server**.

### Bước 1: Clone dự án
```bash
git clone <repository_url>
cd vietmoney-assistant
```

### Bước 2: Cài đặt & Chạy AI Service (Port 8001)
