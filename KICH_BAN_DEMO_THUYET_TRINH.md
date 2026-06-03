# KỊCH BẢN DEMO WEB - VIETMONEY ASSISTANT
*(Dành cho buổi bảo vệ Đồ án Chuyên Ngành)*

---

## MỞ ĐẦU (1-2 Phút)
**Người nói:** "Kính chào Quý Thầy Cô Hội đồng. Xin phép Thầy Cô cho em được bắt đầu phần demo sản phẩm thực tế của dự án VietMoney Assistant. Đây là ứng dụng hỗ trợ khách du lịch nước ngoài và người dùng Việt Nam trong việc nhận diện tiền tệ, quản lý chi tiêu và tự động hóa các tiện ích du lịch dựa trên AI."

---

## PHẦN 1: TỔNG QUAN & ĐĂNG NHẬP
**Hành động trên web:**
1. Mở trình duyệt ẩn danh (Incognito) hoặc clear cache, truy cập `http://localhost:5173`.
2. Bấm vào nút đăng nhập/đăng ký. Thực hiện Đăng nhập vào một tài khoản test đã chuẩn bị sẵn (có sẵn dữ liệu budget hoặc travel plan càng tốt).
3. Chuyển sang màn hình Trang chủ (Dashboard).

**Lời thoại:**
> "Đầu tiên, hệ thống được bảo mật bằng JWT thông qua Java Spring Boot. Sau khi đăng nhập thành công, giao diện Dashboard sẽ tổng quan ngay cho người dùng các thông tin tỷ giá cập nhật hôm nay, các bài báo du lịch mới nhất (News) và tóm tắt ngân sách (Budget) còn lại của họ."

---

## PHẦN 2: TÍNH NĂNG NHẬN DIỆN TIỀN TỆ (AI CAMERA)
**Hành động trên web:**
1. Chuyển qua tab/menu **Scan (Quét Tiền)**.
2. Cấp quyền truy cập Camera cho trình duyệt (nếu có popup).
3. Đưa một tờ tiền Việt Nam (ví dụ 100k, 50k) trước camera hoặc nhấn Upload ảnh tờ tiền.
4. Chờ 1-2 giây cho kết quả trả về.

**Lời thoại:**
> "Một trong những rủi ro lớn nhất của du khách là nhầm lẫn các tờ tiền Polyme. Ở chức năng Quét tiền này, Frontend đẩy hình ảnh trực tiếp về AI Service viết bằng Python FastAPI. Hệ thống sẽ nhận dạng mệnh giá ngay lập tức và hiển thị kết quả, đồng thời quy đổi tương đương ra USD để khách hình dung."

---

## PHẦN 3: LÊN KẾ HOẠCH DU LỊCH BẰNG AI (TRAVEL PLAN)
**Hành động trên web:**
1. Chuyển sang tab **Travel Plan**.
2. Bấm Tạo kế hoạch mới. 
3. Nhập điểm đến: "Đà Nẵng", Số ngày: "3". 
4. Bấm "Tạo lịch trình AI".

**Lời thoại:**
> "Thay vì phải tự lên lịch trình bỡ ngỡ, tính năng Travel Plan gọi Backend Spring Boot để giao tiếp trực tiếp với AI Google Gemini. Hệ thống sẽ trả về một bảng lịch trình tự động từ ngày 1 đến ngày 3 cực kì chi tiết, bao gồm cả địa điểm, ăn uống và dự kiến ngân sách."

---

## PHẦN 4: ATM MAP & CHỈ ĐƯỜNG (Focus: Phần bạn làm)
*(Dành nhiều thời gian nhấn mạnh kỹ thuật ở đây)*

**Hành động trên web:**
1. Chuyển sang tab **ATM Map / Bản đồ**. 
2. Trình duyệt hỏi vị trí (Geolocation), nhấn Allow/Cho phép.
3. Kéo thả bản đồ, chỉ chuột vào hiệu ứng chấm xanh nhấp nháy (Vị trí User).
4. Gõ lên thanh tìm kiếm: "Vietcombank" (Bản đồ filter lại các điểm VCB).
5. Click vào 1 icon marker ATM bất kỳ -> Mở Popup -> Nhấn **Chỉ đường**.
6. Chỉ chuột dọc theo đường Line xanh lá cây tạo ra trên Map.

**Lời thoại:**
> "Và đây là chức năng Bản đồ ATM do em trực tiếp phụ trách phát triển. 
> 
> Thay vì văng người dùng ra ứng dụng Google Maps, em đã tích hợp bản đồ Goong SDK trực tiếp vào nền tảng. Khi vào đây, hệ thống tự bắt tọa độ GPS. Điểm mạnh ở đây là: em đã xây dựng **thuật toán làm mượt GPS (Smooth GPS)** và **chống spam API** thông qua kỹ thuật Grid Caching ở Backend. Dữ liệu các cây ATM được cache chặt chẽ giúp né tránh rate-limit. 
> 
> Hơn thế nữa, khi nhấn **Chỉ đường**, thuật toán **Snap-to-Road** ở frontend sẽ neo đường vẽ chính xác bám sát theo con đường, tạo trải nghiệm dẫn đường mượt mà như native app di động."

---

## PHẦN 5: CHATBOT AI STREAMING (Focus: Phần bạn làm)
**Hành động trên web:**
1. Ở giao diện bất kỳ, nhấn vào biểu tượng **Chatbot** (thường nổi ở góc phải dưới).
2. Chat: *"Tôi nên đổi tiền Việt ở đâu an toàn nhất?"*
3. Chỉ chuột vào con trỏ đang hiển thị chữ chạy theo thời gian thực (hiệu ứng typing).
4. *(Tùy chọn)* Gõ một câu không liên quan/chưa có data để demo popup "Gợi ý tìm kiếm Web".

**Lời thoại:**
> "Cuối cùng là công cụ AI Chatbot - cũng nằm trong luồng nhiệm vụ của em. Để khắc phục sự nhàm chán khi phải chờ ngâm câu hỏi quá lâu (thường thấy ở các ứng dụng gọi LLM truyền thống), em đã cài đặt kiến trúc **Server-Sent Events (SSE)**.
> 
> Như Thầy Cô thấy, câu trả lời từ AI được Stream (đổ về) từng chữ một theo thời gian thực (Real-time). Nó không bắt trình duyệt load lại. Ngoài ra, Bot còn tích hợp cơ chế Fallback (Web Search Suggestion) để chống hiện tượng AI ảo giác (Hallucination) – một tiêu chuẩn cực kì quan trọng đối với dữ liệu ngành Tài chính."

---

## KẾT THÚC DEMO
**Hành động:** 
1. Thu nhỏ Chatbox. 
2. Chuyển về Dashboard hoặc để view Bản đồ tổng quan.

**Lời thoại:**
> "Dự án VietMoney Assistant không chỉ giải quyết 1 tính năng nhỏ mà tạo ra nguyên một hệ sinh thái đồng bộ khép kín cho trải nghiệm tiêu dùng của du khách.
>
> Phần demo của nhóm chúng em đến đây là kết thúc. Chúng em xin cảm ơn Quý Thầy Cô đã theo dõi và rất mong nhận được những góp ý, câu hỏi từ Hội đồng ạ."

---

### 💡 MẸO KHI DEMO:
1. **Mạng Internet:** Hãy chắc chắn mạng Wifi tải bản đồ nhanh, hoặc xài 4G phát từ điện thoại để ngừa rủi ro.
2. **Khởi động server sẵn:** Hãy chạy sẵn `backend`, `frontend`, và `ai-service` từ 30 phút trước khi thuyết trình. Mở web lên test trước 1 vòng để cache được database nóng, bản đồ mượt.
3. **Quản lý thời gian:** Nên demo tất cả gói gọn trong 3-5 phút, không mải mê click quá sâu vào những lỗi lặt vặt (nếu có). Trọng tâm là hình động, AI tự sinh chữ, và Bản đồ.
