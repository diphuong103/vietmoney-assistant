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
* **Tin tức (News):** Các bài viết tin tức mới nhất.
* **Chatbot AI:** Hỗ trợ tư vấn du lịch và tài chính (Các thông tin cố định hoặc realtime liên quan đến du lịch và tài chính).

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

### Bước 2: Cài đặt và Khởi chạy AI Service (Python FastAPI - Port 8001)
Dịch vụ xử lý ảnh bằng AI cần chạy ngầm liên tục để phân tích hình ảnh quét tiền tệ/hoá đơn.
```bash
cd ai-service
python -m venv venv

# Active môi trường:
# Trên Windows:
venv\Scripts\activate
# Trên macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Bước 3: Cài đặt và Khởi chạy Backend (Spring Boot - Port 8080)
1. Tự động tìm File `backend/src/main/resources/application.yml` (hoặc `application-dev.yml`).
2. Sửa thông số cấu hình DataBase cho phù hợp với MySQL của bạn (như `url`, `username`, `password`). Đảm bảo bạn đã khởi tạo sẵn database trắng với tên `vietmoney_db`.
3. Khởi chạy:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
(Dịch vụ sẽ tự động ánh xạ cấu trúc bảng qua Hibernate ddl-auto).

### Bước 4: Cài đặt và Khởi chạy Frontend (ReactJS + Vite - Port 5173)
Bạn nên thiết lập file `.env` bằng cách copy từ `.env.example` trước nếu có.
```bash
cd frontend
npm install
npm run dev
```
Trang phát triển thường định tuyến sẵn ở địa chỉ [http://localhost:5173](http://localhost:5173).

---

## 6. Thiết lập Môi trường / API API-Keys
Dự án phụ thuộc vào hệ sinh thái của các công ty thứ ba cho vài tính năng. Để website hoạt động trơn tru toàn diện, bạn cần thay thiết lập các khóa Variable ở application.yml (Backend) và .env (Frontend) hoặc cấu hình tham số môi trường ENV chuẩn trong triển khai:
- `JWT_SECRET` : Tạo tính năng mã hoá phiên làm việc bảo mật.
- `MAIL_USERNAME` / `MAIL_PASSWORD` : Cho SMTP (OTP / Đăng ký).
- `CLOUDINARY` : Hỗ trợ lưu Media (Hình ảnh người dùng và tin tức).
- `GEMINI` : Phục vụ mô phỏng API Chatbot tư vấn.
- `GOONG MAPS` : Cho khả năng mở tính năng bản đồ và Layer ATM.
- `EXCHANGERATE` : Lấy kết quả Tỷ Giá (Exhange rates) thực tế hằng ngày.

---

## 7. Ghi chú đóng góp (Contribution)
Khi phát triển tính năng mới cho **VietMoney Assistant**, vui lòng Checkout ra nhánh (`branch`) mới định dạng như `feature/ten-tinh-nang` hoặc `fix/dang-nhiem-bug`. Sử dụng Pull Request cho việc xác minh trước khi xác nhận vào hàm Code `main`.

_Cảm ơn bạn đã lựa chọn sử dụng hay phát triển ứng dụng - chung tay bảo vệ nền tiện ích tài chính an toàn minh bạch!_
