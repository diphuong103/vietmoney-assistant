# 🇻🇳 VietMoney Assistant

Ứng dụng hỗ trợ du khách nước ngoài tại Việt Nam — quản lý ngân sách, quy đổi tiền tệ, nhận diện tiền VND bằng AI.

## 🏗️ Kiến trúc

| Service | Công nghệ | Port |
|---------|-----------|------|
| Backend | Spring Boot 3 + Java 21 | 8080 |
| Frontend | React 18 + Vite + TailwindCSS | 3000 |
| AI Service | Python FastAPI + PyTorch | 8001 |
| Database | MySQL 8 | 3306 |
| Cache | Redis 7 | 6379 |


## 👥 Tài khoản mặc định

- **Admin**: `admin` / `Admin@123`

vietmoney-assistant/
├── .env                         # Biến môi trường tổng của dự án
├── .gitignore                   # Cấu hình bỏ qua file khi push Git
├── README.md                    # Tài liệu mô tả dự án (bạn dán cấu trúc này vào đây)
│
├── ai-service/                  # 🤖 PYTHON AI SERVICE (Chỉ chạy Inference)
│   ├── .env                     # Biến môi trường riêng cho AI (Port, API Keys)
│   ├── Dockerfile               # Build image siêu nhẹ cho AI
│   ├── requirements.txt         # Thư viện: fastapi, uvicorn, opencv-python, onnxruntime...
│   └── app/
│       ├── main.py              # Entry point FastAPI (nhận request từ Java)
│       ├── core/                # Config load model một lần khi start server
│       ├── models_weight/       # Chứa file weights đã train (best_model.h5 / .onnx)
│       ├── routers/             # API Endpoints (vd: predict.py, health.py)
│       └── services/            # Logic tiền xử lý ảnh (resize, normalize)
│
├── backend/                     # ☕ JAVA SPRING BOOT (Core Backend & Gateway)
│   ├── Dockerfile
│   ├── pom.xml                  # Quản lý thư viện Maven (thêm mapstruct, webclient...)
│   └── src/
│       ├── main/
│       │   ├── resources/
│       │   │   ├── application.yml         # Config DB, Caching, AI URL, JWT Secret
│       │   │   ├── application-dev.yml
│       │   │   ├── application-prod.yml
│       │   │   └── db/migration/           # Flyway/Liquibase (V1__init.sql, V2__seed.sql)
│       │   │
│       │   └── java/com/vietmoney/
│       │       ├── VietMoneyApplication.java
│       │       │
│       │       ├── config/                 # Cấu hình Bean (Security, Cors, WebClient, Swagger)
│       │       ├── controller/             # Nhận HTTP Request từ React
│       │       │   ├── AdminController.java
│       │       │   ├── ArticleController.java
│       │       │   ├── AuthController.java
│       │       │   ├── BudgetController.java
│       │       │   ├── ExchangeRateController.java
│       │       │   └── ScanController.java
│       │       │
│       │       ├── domain/                 # Models định nghĩa Database
│       │       │   ├── entity/             # Các Class map với table MySQL (@Entity)
│       │       │   └── enums/              # Các hằng số (Role, Currency, ArticleStatus)
│       │       │
│       │       ├── dto/                    # Data Transfer Objects
│       │       │   ├── request/            # Dữ liệu Frontend gửi lên (LoginRequest...)
│       │       │   └── response/           # Dữ liệu trả về Frontend (ApiResponse...)
│       │       │
│       │       ├── exception/              # Bắt lỗi tập trung (GlobalExceptionHandler)
│       │       │
│       │       ├── mapper/                 # 🚀 Chuyển đổi Entity <-> DTO (Dùng MapStruct)
│       │       │   ├── ArticleMapper.java
│       │       │   ├── BudgetMapper.java
│       │       │   ├── ScanHistoryMapper.java
│       │       │   ├── TravelPlanMapper.java
│       │       │   └── UserMapper.java
│       │       │
│       │       ├── repository/             # Tương tác MySQL (Spring Data JPA)
│       │       │
│       │       ├── security/               # Xử lý JWT, Filter, UserDetails
│       │       │
│       │       ├── service/                # 🧠 Lớp Interface (Định nghĩa nghiệp vụ)
│       │       │   ├── auth/
│       │       │   │   ├── AuthService.java
│       │       │   │   └── OtpService.java
│       │       │   ├── AiProxyService.java # Cầu nối gọi sang Python AI
│       │       │   ├── ArticleService.java
│       │       │   ├── AtmService.java
│       │       │   ├── BudgetService.java
│       │       │   ├── ExchangeRateService.java
│       │       │   ├── ScanService.java    # Core: Xử lý quy trình quét tiền
│       │       │   ├── TravelPlanService.java
│       │       │   ├── UserService.java
│       │       │   ├── WikiPriceService.java
│       │       │   │
│       │       │   └── impl/               # ⚙️ Bản thực thi (Implementation)
│       │       │       ├── AiProxyServiceImpl.java
│       │       │       ├── ArticleServiceImpl.java
│       │       │       ├── AtmServiceImpl.java
│       │       │       ├── AuthServiceImpl.java
│       │       │       ├── BudgetServiceImpl.java
│       │       │       ├── ExchangeRateServiceImpl.java
│       │       │       ├── OtpServiceImpl.java
│       │       │       ├── ScanServiceImpl.java
│       │       │       ├── TravelPlanServiceImpl.java
│       │       │       ├── UserServiceImpl.java
│       │       │       └── WikiPriceServiceImpl.java
│       │       │
│       │       └── util/                   # Công cụ hỗ trợ (FormatDate, FormatCurrency)
│       │
│       └── test/java/com/vietmoney/        # Nơi viết Unit Test (JUnit, Mockito)
│
├── frontend/                    # ⚛️ REACT.JS + VITE (Giao diện người dùng)
│   ├── .env.development
│   ├── .env.production
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf               # Cấu hình Nginx để deploy build React
│   ├── package.json
│   ├── tailwind.config.js       # Cấu hình UI CSS
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── api/                 # Cấu hình Axios & gọi API Backend  thư viện HTTP Client dựa trên Promise được sử dụng trong các ứng dụng React để gửi các yêu cầu HTTP đến máy chủ và nhận phản hồi. Axios giúp việc kết nối và thao tác với API trở nên dễ dàng và hiệu quả hơn.
│       │   ├── axiosClient.js   # Cấu hình interceptor (gắn token vào header)
│       │   ├── authApi.js
│       │   ├── scanApi.js
│       │   └── ...
│       ├── assets/              # Ảnh tĩnh, fonts, css global
│       ├── components/          # UI dùng chung
│       │   ├── common/          # Button, Input, Modal, Spinner
│       │   └── layout/          # ClientLayout, AdminLayout, BottomNav (Mobile)
│       ├── hooks/               # Custom hooks
│       │   ├── useAuth.js       # Quản lý state đăng nhập
│       │   ├── useCamera.js     # Gọi camera thiết bị để quét tiền
│       │   └── useGeolocation.js# Lấy tọa độ tìm ATM
│       ├── locales/             # File ngôn ngữ (vi.json, en.json, ko.json)
│       ├── pages/               # Giao diện từng trang
│       │   ├── admin/           # Dashboard, UserManagement, ArticleApproval
│       │   ├── auth/            # Login, Register, ForgotPassword, VerifyOtp
│       │   └── client/          # ScanPage, BudgetPage, TravelPlanPage, NewsPage...
│       ├── routes/              # Định tuyến (React Router)
│       ├── store/               # Quản lý State toàn cục (Zustand/Redux)
│       └── utils/               # Constants, format helper (tiền, ngày)
│
└── devops/                      # ⚙️ DEVOPS & INFRASTRUCTURE
├── docker-compose.yml       # Chạy 1-click toàn bộ DB, Java, Python, Nginx
└── .github/
└── workflows/           # Tự động hóa CI/CD
├── ci-backend.yml
└── ci-frontend.yml