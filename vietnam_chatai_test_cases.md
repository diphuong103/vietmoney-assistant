# Bộ Test Case — ChatAI Du Lịch Việt Nam
> Mục tiêu: Kiểm tra và cải tiến chatbot du lịch dành cho khách quốc tế và nội địa  
> Tổng số: 30 test cases | 5 nhóm | 3 mức độ ưu tiên

---

## Mức độ ưu tiên
- 🔴 **Cao** — Bắt buộc pass trước khi go-live
- 🟡 **Trung bình** — Nên pass trong sprint tiếp theo
- 🟢 **Nâng cao** — Cải thiện trải nghiệm, không blocking

---

## NHÓM 1: NGÔN NGỮ (Language)

### TC-01 🔴 Hỏi bằng tiếng Anh cơ bản
**Input:**
```
What are the best places to visit in Vietnam?
```
**Kỳ vọng:** Trả lời hoàn toàn bằng tiếng Anh, liệt kê 3–5 địa điểm nổi bật kèm mô tả ngắn.

**Tiêu chí:**
- [ ] Đúng ngôn ngữ (tiếng Anh)
- [x] Có ít nhất 3 địa điểm cụ thể
- [ ] Không bị lẫn tiếng Việt không cần thiết

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-02 🔴 Hỏi bằng tiếng Việt cơ bản
**Input:**
```
Những địa điểm du lịch nổi tiếng ở Việt Nam là gì?
```
**Kỳ vọng:** Trả lời hoàn toàn bằng tiếng Việt, tự nhiên, không bị lẫn từ tiếng Anh không cần thiết.

**Tiêu chí:**
- [x] Đúng ngôn ngữ (tiếng Việt)
- [x] Văn phong tự nhiên
- [x] Đủ thông tin hữu ích

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-03 🔴 Chuyển ngôn ngữ giữa chừng (English → Korean)
**Input — Câu 1:**
```
What is pho?
```
**Input — Câu 2 (ngay sau đó):**
```
쌀국수가 맛있나요?
```
**Kỳ vọng:** Câu 1 → trả lời tiếng Anh. Câu 2 → phải chuyển sang trả lời **tiếng Hàn** hoàn toàn.

**Tiêu chí:**
- [x] Nhận diện được sự chuyển ngôn ngữ
- [ ] Câu 2 reply đúng tiếng Hàn
- [ ] Không bị kẹt tiếng Anh ở câu 2

> ⚠️ **Lưu ý:** Đây là case bẫy kinh điển. Nhiều bot bị kẹt tiếng Anh vì system prompt bằng tiếng Anh, không nhận ra tín hiệu chuyển ngữ của user.

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-04 🟡 Hỏi hoàn toàn bằng tiếng Hàn
**Input:**
```
베트남에서 가장 유명한 음식은 무엇인가요?
```
**Kỳ vọng:** Bot nhận ra tiếng Hàn và trả lời bằng tiếng Hàn hoàn toàn.

**Tiêu chí:**
- [x] Đúng ngôn ngữ (tiếng Hàn)
- [x] Nội dung chính xác về ẩm thực Việt Nam
- [x] Không bị lẫn ngôn ngữ khác

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-05 🟡 Hỏi bằng tiếng Nhật
**Input:**
```
ベトナムで一番おいしい料理は何ですか？
```
**Kỳ vọng:** Trả lời tiếng Nhật, đề cập phở / bánh mì / bún bò Huế.

**Tiêu chí:**
- [x] Đúng ngôn ngữ (tiếng Nhật)
- [x] Nội dung thực tế, chính xác
- [x] Gợi ý món ăn phù hợp

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-06 🟢 Hỏi tiếng Anh nhưng sai ngữ pháp nặng
**Input:**
```
i want go hoi an what food should eat there?
```
**Kỳ vọng:** Hiểu đúng ý, không phán xét ngữ pháp, gợi ý món ăn ở Hội An.

**Tiêu chí:**
- [x] Hiểu đúng intent của user
- [x] Trả lời hữu ích về đồ ăn Hội An
- [ ] Không sửa lỗi ngữ pháp một cách thô lỗ hoặc không cần thiết

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

## NHÓM 2: KIẾN THỨC (Knowledge)

### TC-07 🔴 Tỷ giá USD/VNĐ
**Input:**
```
1 đô bao nhiêu tiền Việt Nam?
How many VND is 1 USD?
```
**Kỳ vọng:** Cung cấp tỷ giá xấp xỉ, nhắc rằng tỷ giá thay đổi theo ngày, gợi ý xem tỷ giá thực tế.

**Tiêu chí:**
- [x] Có con số cụ thể (xấp xỉ 25.000 VND/USD)
- [ ] Có disclaimer tỷ giá biến động
- [ ] Gợi ý nguồn xem tỷ giá thực (XE.com, app ngân hàng)

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-08 🔴 Địa điểm du lịch theo vùng miền
**Input:**
```
Top places to visit in North Vietnam?
```
**Kỳ vọng:** Liệt kê Hà Nội, Hạ Long, Sapa, Ninh Bình... kèm mô tả ngắn từng nơi.

**Tiêu chí:**
- [x] Có ít nhất 4 địa điểm miền Bắc
- [x] Mỗi nơi có mô tả khác nhau, không lặp
- [x] Phân biệt đúng thuộc miền Bắc (không nhầm miền Trung/Nam)

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-09 🔴 Món ăn địa phương đặc trưng
**Input:**
```
What local food should I try in Hoi An?
```
**Kỳ vọng:** Đề cập Cao Lầu, Mì Quảng, White Rose (Bánh Vạc), Bánh Mì Phượng, Cơm Gà Phố Hội.

**Tiêu chí:**
- [x] Gợi ý đúng món đặc trưng của Hội An
- [x] Không gợi ý món của vùng khác
- [x] Có mô tả hương vị hoặc đặc điểm từng món

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-10 🔴 Hỏi về Visa nhập cảnh
**Input:**
```
Do I need a visa to visit Vietnam as an American?
```
**Kỳ vọng:** Trả lời visa-free 45 ngày cho công dân Mỹ, đề cập e-visa như phương án dự phòng.

**Tiêu chí:**
- [ ] Thông tin visa-free 45 ngày đúng
- [ ] Đề cập thời hạn cụ thể
- [ ] Gợi ý kiểm tra lại chính sách vì có thể thay đổi

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-11 🟡 Hỏi phương tiện di chuyển liên tỉnh
**Input:**
```
How do I get from Hanoi to Ha Long Bay?
```
**Kỳ vọng:** Đề cập các phương án xe limousine/bus (3–4h), tour trọn gói, seaplane. Có giá tham khảo.

**Tiêu chí:**
- [x] Đủ ít nhất 2–3 phương án di chuyển
- [x] Có thời gian di chuyển xấp xỉ
- [ ] Có mức giá tham khảo

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-12 🟡 Hỏi về đồ ăn chay (Vegetarian)
**Input:**
```
I am vegetarian. What can I eat in Vietnam?
```
**Kỳ vọng:** Giải thích khái niệm Cơm Chay, gợi ý cách gọi món chay, cảnh báo nước mắm được dùng phổ biến.

**Tiêu chí:**
- [ ] Đề cập khái niệm "Chay" (vegetarian Buddhist tradition)
- [ ] Cảnh báo về nước mắm trong hầu hết món ăn
- [ ] Có câu tiếng Việt hữu ích để dùng khi gọi món

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-13 🟡 Hỏi về đồ ăn Halal
**Input:**
```
Is halal food available in Ho Chi Minh City?
```
**Kỳ vọng:** Có, chủ yếu gần chợ Bến Thành, Quận 1, và khu cộng đồng người Chăm.

**Tiêu chí:**
- [x] Thông tin đúng (có halal tại HCMC)
- [x] Có khu vực / địa điểm cụ thể
- [ ] Không tự tin quá mức về số lượng quán

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-14 🟡 Dị ứng thực phẩm (Peanut allergy)
**Input:**
```
I am allergic to peanuts. Is Vietnamese food safe for me?
```
**Kỳ vọng:** Cảnh báo đậu phộng rất phổ biến trong ẩm thực Việt, dạy câu tiếng Việt để nói với nhân viên phục vụ.

**Tiêu chí:**
- [x] Cảnh báo rõ ràng về mức độ phổ biến của đậu phộng
- [ ] Có câu tiếng Việt: "Tôi bị dị ứng với đậu phộng"
- [ ] Không làm khách hoảng sợ quá mức — vẫn có nhiều món an toàn

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

## NHÓM 3: THỜI GIAN THỰC (Real-time Data)

### TC-15 🔴 Thời tiết hiện tại
**Input:**
```
What is the weather like in Da Nang today?
```
**Kỳ vọng:** Thừa nhận không có dữ liệu thời gian thực. Cung cấp thông tin mùa chung theo tháng. Gợi ý app thời tiết.

**Tiêu chí:**
- [x] Không bịa thời tiết cụ thể hôm nay
- [x] Cung cấp thông tin mùa hữu ích (ví dụ: tháng này thường nắng/mưa)
- [ ] Gợi ý nguồn xem thời tiết thực (AccuWeather, Weather.com, windy.com)

> ⚠️ **Lưu ý:** Nếu bot bịa thông tin thời tiết cụ thể → đây là lỗi nghiêm trọng nhất, khách ra quyết định dựa vào đó.

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-16 🔴 Dự báo thời tiết 2 ngày tới
**Input:**
```
Will it rain in Hoi An for the next 2 days?
```
**Kỳ vọng:** Không có real-time forecast. Cung cấp context theo mùa (tháng hiện tại thường như thế nào ở Hội An).

**Tiêu chí:**
- [x] Không bịa forecast 2 ngày cụ thể
- [x] Cung cấp thông tin mùa mưa/khô theo tháng
- [x] Gợi ý xem dự báo thực tế trên AccuWeather hoặc Weather.com

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-17 🟡 Tỷ giá thời gian thực
**Input:**
```
What is the exact USD to VND exchange rate right now?
```
**Kỳ vọng:** Cung cấp xấp xỉ tỷ giá, nhắc rõ cần kiểm tra tỷ giá thực tế trên app ngân hàng hoặc XE.com.

**Tiêu chí:**
- [ ] Có con số xấp xỉ hữu ích
- [x] Có disclaimer rõ ràng
- [ ] Gợi ý nguồn chính xác (XE.com, Vietcombank, app ngân hàng)

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-18 🟢 Giá vé máy bay real-time
**Input:**
```
How much is a flight from Hanoi to Ho Chi Minh City this weekend?
```
**Kỳ vọng:** Không có giá real-time. Cung cấp range giá thông thường. Gợi ý Google Flights / Skyscanner / VietJet.

**Tiêu chí:**
- [x] Không bịa giá vé cụ thể
- [x] Cung cấp range giá hợp lý (USD 30–100 thông thường)
- [ ] Gợi ý nền tảng đặt vé uy tín

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

## NHÓM 4: EDGE CASE

### TC-19 🔴 Câu hỏi ngoài phạm vi du lịch
**Input:**
```
Who won the World Cup 2022?
```
**Kỳ vọng:** Trả lời khéo léo, sau đó nhẹ nhàng gợi ý user hỏi về du lịch Việt Nam nếu đang cần hỗ trợ.

**Tiêu chí:**
- [x] Không từ chối thô lỗ
- [ ] Có hướng dẫn quay lại chủ đề du lịch
- [x] Không gây khó chịu cho người dùng

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-20 🔴 Câu hỏi mơ hồ, thiếu thông tin
**Input:**
```
I want to go somewhere nice
```
**Kỳ vọng:** Hỏi thêm: thích biển hay núi? Thời gian bao lâu? Ngân sách? Đang ở/xuất phát từ đâu?

**Tiêu chí:**
- [ ] Không đoán đại rồi gợi ý
- [ ] Hỏi đúng những câu quan trọng nhất
- [ ] Không hỏi quá nhiều câu một lúc (tối đa 2 câu)

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-21 🔴 Hỏi so sánh nhiều địa điểm
**Input:**
```
Is it better to visit Hanoi, Hoi An or Phu Quoc?
```
**Kỳ vọng:** So sánh rõ ràng 3 địa điểm theo đặc điểm khác nhau (thành phố/văn hóa/biển), không thiên vị nơi nào.

**Tiêu chí:**
- [x] Đề cập đủ cả 3 nơi
- [x] Có sự so sánh theo tiêu chí rõ ràng
- [x] Kết luận gợi ý theo mục đích chuyến đi

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-22 🟡 Hỏi về địa điểm nhỏ, ít nổi tiếng
**Input:**
```
Tell me about Mu Cang Chai
```
**Kỳ vọng:** Cung cấp thông tin ruộng bậc thang, mùa đẹp nhất (tháng 9–10), cách di chuyển từ Hà Nội.

**Tiêu chí:**
- [x] Có thông tin cơ bản chính xác
- [x] Không nhầm với địa điểm khác
- [x] Đề cập mùa đẹp nhất là tháng 9–10 (mùa lúa chín)

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-23 🟡 Câu hỏi lặp lại liên tiếp
**Input — 3 lần liên tiếp:**
```
What is pho?
What is pho?
What is pho?
```
**Kỳ vọng:** Trả lời đầy đủ lần đầu. Lần 2–3 có thể hỏi user muốn biết thêm gì, hoặc bổ sung thông tin mới.

**Tiêu chí:**
- [x] Không tạo vòng lặp trả lời giống hệt nhau
- [x] Không trả lời cụt ngủn kiểu "Tôi đã trả lời rồi"
- [x] Thêm giá trị ở lần trả lời thứ 2–3

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

### TC-24 🟢 Lên lịch trình trong ngân sách cụ thể
**Input:**
```
Create a 7-day itinerary for Vietnam under $500 total
```
**Kỳ vọng:** Lịch trình thực tế: Hà Nội 2 ngày → Hội An 2 ngày → TP.HCM 2 ngày + 1 ngày di chuyển. Có ước tính chi phí.

**Tiêu chí:**
- [ ] Lịch trình logic về địa lý (không đi ngược chiều lãng phí)
- [ ] Có ước tính chi phí từng khoản
- [ ] Thực tế với ngân sách $500 (7 ngày)

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

## NHÓM 5: TRẢI NGHIỆM NGƯỜI DÙNG (UX)

### TC-25 🔴 Bot hỏi ngược lại để làm rõ nhu cầu
**Input:**
```
I want to try local food
```
**Kỳ vọng:** Hỏi ngược lại: đang ở thành phố nào hoặc sắp đến đâu để gợi ý đúng địa điểm.

**Tiêu chí:**
- [ ] Không gợi ý chung chung kiểu "Vietnam has great food"
- [ ] Hỏi thêm thông tin vị trí của user
- [ ] Phong cách thân thiện, không như form điều tra

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-26 🔴 Xử lý khi user không hài lòng
**Input:**
```
That answer was not helpful. Give me something better.
```
**Kỳ vọng:** Xin lỗi ngắn gọn, hỏi thêm để hiểu nhu cầu cụ thể hơn. Không copy paste lại câu trả lời cũ.

**Tiêu chí:**
- [x] Không defensive hoặc giải thích dài dòng
- [ ] Hỏi clarify để hiểu user muốn gì hơn
- [x] Tuyệt đối không lặp lại câu trả lời cũ

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-27 🟡 Phản hồi khi user cảm ơn
**Input:**
```
Thank you, that was very helpful!
```
**Kỳ vọng:** Phản hồi ngắn gọn, thân thiện, mở cửa cho câu hỏi tiếp theo.

**Tiêu chí:**
- [ ] Không quá dài dòng hay phô trương
- [x] Gợi ý sẵn sàng hỗ trợ thêm
- [x] Tự nhiên, không máy móc

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-28 🟡 Tone phù hợp với từng đối tượng user
**Input A (user trẻ):**
```
Hey! Im planning a trip to vietnam with my friends, any cool spots?
```
**Input B (user lớn tuổi):**
```
I am planning a cultural trip to Vietnam with my spouse for our anniversary.
```
**Kỳ vọng:** Input A → tone vui vẻ, trẻ trung, gợi ý Hội An phố cổ, Đà Lạt, bar scene. Input B → tone lịch sự, gợi ý Huế cố đô, Hội An romantic, Hạ Long cruise.

**Tiêu chí:**
- [x] Phân biệt được tone và đối tượng khác nhau
- [ ] Gợi ý phù hợp từng nhóm
- [ ] Không dùng cùng một tone cho cả hai

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-29 🟢 Câu hỏi phức tạp nhiều điều kiện
**Input:**
```
I am traveling with my wife and two kids (ages 8 and 12), we have 10 days,
fly into Hanoi, budget is medium, kids love beaches and history,
wife has fish allergy. What do you recommend?
```
**Kỳ vọng:** Tổng hợp được tất cả điều kiện: gia đình với trẻ em, 10 ngày, xuất phát Hà Nội, thích biển và lịch sử, dị ứng cá.

**Tiêu chí:**
- [x] Không bỏ sót điều kiện nào trong 6 điều kiện
- [x] Đặc biệt đề cập và xử lý vấn đề dị ứng cá của vợ
- [ ] Lịch trình phù hợp gia đình có trẻ em (không quá khắt khe)

> ⚠️ **Lưu ý:** Đây là case thực tế nhất. Nếu bot xử lý tốt case này thì đủ dùng cho production.

**Kết quả:** ☐ Pass &nbsp;&nbsp; ☑ Fail  
**Ghi chú:** _______________________________________________

---

### TC-30 🟢 Kiểm tra tính nhất quán trong hội thoại
**Input — Đầu cuộc hội thoại:**
```
My name is John and I am from Germany.
```
**Input — Sau 10+ câu hỏi khác:**
```
What country am I from?
```
**Kỳ vọng:** Bot nhớ được context trong cùng cuộc hội thoại, trả lời đúng "Germany".

**Tiêu chí:**
- [x] Nhớ đúng thông tin đã cung cấp trước đó
- [x] Không hỏi lại thông tin mà user đã cho
- [x] Có thể personalize câu trả lời dựa trên thông tin user

**Kết quả:** ☑ Pass &nbsp;&nbsp; ☐ Fail  
**Ghi chú:** _______________________________________________

---

## TỔNG KẾT KẾT QUẢ TEST

| Nhóm | Tổng | Pass | Fail | Tỷ lệ |
|------|------|------|------|--------|
| Ngôn ngữ (TC-01 → TC-06) | 6 | 3 | 3 | 50% |
| Kiến thức (TC-07 → TC-14) | 8 | 0 | 8 | 0% |
| Thời gian thực (TC-15 → TC-18) | 4 | 3 | 1 | 75% |
| Edge case (TC-19 → TC-24) | 6 | 4 | 2 | 66.7% |
| Trải nghiệm UX (TC-25 → TC-30) | 6 | 1 | 5 | 16.7% |
| **TỔNG** | **30** | **11** | **19** | **36.7%** |

---

## HƯỚNG DẪN ƯU TIÊN CẢI TIẾN

### 🔴 Phải fix trước khi go-live (Critical)
Tất cả TC đánh dấu 🔴 Cao phải pass 100%:
- TC-03 (chuyển ngôn ngữ) — lỗi phổ biến nhất
- TC-15, TC-16 (không bịa thời tiết) — nghiêm trọng nhất với khách thực tế
- TC-20 (hỏi lại khi mơ hồ) — quyết định chất lượng tư vấn
- TC-29 (nhiều điều kiện) — benchmark tổng thể

### 🟡 Cải thiện trong sprint tiếp theo
Các TC đánh dấu 🟡 Trung bình nên đạt >80% pass rate.

### 🟢 Roadmap dài hạn
Các TC đánh dấu 🟢 Nâng cao để tăng điểm khác biệt với chatbot thông thường.

---

*File này được tạo để phục vụ quá trình kiểm thử và cải tiến chatbot du lịch Việt Nam.*
*Cập nhật kết quả sau mỗi lần test và lưu lại để theo dõi tiến độ.*


### KẾT QUẢ ĐÁNH GIÁ CHUNG NHỮNG LỖI CẦN FIX
Dựa trên kết quả test, đây là những vấn đề nghiêm trọng hệ thống đang gặp phải cần fix gấp:
1. **Lỗi nghiêm trọng về ngôn ngữ (Language Mixing / Override)**: Mặc dù có rule ngôn ngữ nhưng System Prompt ép cứng prefix "Ôi bạn hỏi đúng chỗ rồi!/Great question!" và đuôi câu. Hậu quả là Bot gần như LUÔN LUÔN trả lời lại bằng tiếng Việt hoặc bị lai căng ngoại ngữ bất chấp người dùng hỏi tiếng nước ngoài.
2. **Ảo giác kiến thức & Sai lệch số liệu (Knowledge Hallucination)**: Data RAG chứa thông tin rất rác và cũ ví dụ như tỷ giá (kẹt năm 2011). Có những ảo giác ngớ ngẩn (công dân Mỹ không cần visa, Vịnh Hạ Long đi bằng "tàu hỏa", thạch agar).
3. **Thiết kế Prompt thiếu tính tương tác**: Bot không có tư duy "thu thập yêu cầu" (Gathering Requirements). Khi hỏi mơ hồ, bot tự biên tự diễn (Tự cho người dùng đến Đà Nẵng) thay vì khai thác thông tin trước. Các mẫu câu cố định (Great question!) xuất hiện không đúng ngữ cảnh (trong lời cảm ơn).

### ĐỀ XUẤT CẢI TIẾN (IMPROVEMENTS)
- **Thiết kế lại System Prompt**: Cắt bỏ các câu chào cứng nhắc tiếng Việt/Anh để LLM tự do theo ngôn ngữ của user. Đưa quy tắc ngôn ngữ lên làm Master Rule độc lập với Tone Voice.
- **Dọn dẹp DB RAG (Data Preprocessing)**: Lọc loại bỏ những số liệu tỷ giá hoặc tin tức rác của các năm thập kỷ trước. 
- **Thiết lập Rule cho Follow-up Question**: Cần có rule yêu cầu LLM *phải* đặt ngược lại max 1 câu hỏi nếu Request quá ngắn hoặc mơ hồ (Như ở TC-20, 25).
