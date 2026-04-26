import re
import os

filepath = r"d:\Project_y\vietmoney-assistant\vietnam_chatai_test_cases.md"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Helper to check off criteria
def mark_pass(text, tc, criteria_indices, result, notes):
    # Find the chunk for the TC
    tc_pattern = re.compile(rf"(### {tc}.*?)(?=\n---|\Z)", re.DOTALL)
    match = tc_pattern.search(text)
    if not match:
        print(f"Not found {tc}")
        return text
    
    chunk = match.group(1)
    
    # Replace checkboxes
    lines = chunk.split('\n')
    checkbox_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('- [ ]'):
            if checkbox_idx in criteria_indices:
                lines[i] = line.replace('- [ ]', '- [x]', 1)
            checkbox_idx += 1
            
    # Replace Kết quả
    new_chunk = '\n'.join(lines)
    if result == "Pass":
        new_chunk = new_chunk.replace("☐ Pass &nbsp;&nbsp; ☐ Fail", "☑ Pass &nbsp;&nbsp; ☐ Fail")
    else:
        new_chunk = new_chunk.replace("☐ Pass &nbsp;&nbsp; ☐ Fail", "☐ Pass &nbsp;&nbsp; ☑ Fail")
        
    # Replace Ghi chú
    new_chunk = re.sub(r"Ghi chú: _+", f"Ghi chú: {notes}", new_chunk)
    
    return text.replace(chunk, new_chunk)

# TC-01
text = mark_pass(text, r"TC-01", [1], "Fail", "Bot bị lai ngôn ngữ, mở đầu và kết thúc bằng tiếng Việt do System Prompt ép cứng.")
# TC-02
text = mark_pass(text, r"TC-02", [0, 1, 2], "Pass", "Trả lời tiếng Việt tốt, tự nhiên và thông tin đầy đủ.")
# TC-03
text = mark_pass(text, r"TC-03", [0], "Fail", "Bot nhận ra là tiếng Hàn nhưng xin lỗi và trả lời bằng tiếng Việt (không trả lời tiếng Hàn).")
# TC-04
text = mark_pass(text, r"TC-04", [0, 1, 2], "Pass", "Trả lời tốt tiếng Hàn, nhận diện đúng các món ăn Việt Nam.")
# TC-05
text = mark_pass(text, r"TC-05", [0, 1, 2], "Pass", "Trả lời chính xác, format tiếng Nhật tốt.")
# TC-06
text = mark_pass(text, r"TC-06", [0, 1], "Fail", "Hiểu ý đúng nhưng lại trả lời bằng tiếng Việt thay vì dùng tiếng Anh phản hồi lại user.")

# TC-07
text = mark_pass(text, r"TC-07", [0], "Fail", "Dữ liệu bị cũ (kẹt năm 2011), không có dòng cảnh báo biến động đúng nghĩa và nhắc đến nguồn đáng tin cậy để xem.")
# TC-08
text = mark_pass(text, r"TC-08", [0, 1, 2], "Fail", "Kiến thức đúng nhưng bị hỏng rule ngôn ngữ (User hỏi tiếng Anh, bot trả lời tiếng Việt).")
# TC-09
text = mark_pass(text, r"TC-09", [0, 1, 2], "Fail", "Món ăn gợi ý đúng, nhưng bot vẫn trả lời toàn bộ bằng tiếng Việt.")
# TC-10
text = mark_pass(text, r"TC-10", [], "Fail", "Ảo giác (Hallucination) nghiệm trọng: Suy diễn công dân Mỹ không cần visa.")
# TC-11
text = mark_pass(text, r"TC-11", [0, 1], "Fail", "Thiếu mức giá cụ thể của Limousine so với tàu, và fail cả quy định ngôn ngữ (trả lời tiếng Việt).")
# TC-12
text = mark_pass(text, r"TC-12", [], "Fail", "Gợi ý lan man (thạch agar, nước mía) không đúng trọng tâm nhắc nhở món ăn chay.")
# TC-13
text = mark_pass(text, r"TC-13", [0, 1], "Fail", "Kiến thức chấp nhận được nhưng trả lời bằng tiếng Việt làm mất rule.")
# TC-14
text = mark_pass(text, r"TC-14", [0], "Fail", "Bot lai ngôn ngữ (nửa Anh nửa Việt) và không dạy câu giao tiếp cần thiết.")

# TC-15
text = mark_pass(text, r"TC-15", [0, 1], "Pass", "Bot từ chối dự báo thật, tuy nhiên vẫn lỗi trả lời tiếng Việt.")
# TC-16
text = mark_pass(text, r"TC-16", [0, 1, 2], "Pass", "Có disclaimer, nhắc check thời tiết thực tế.")
# TC-17
text = mark_pass(text, r"TC-17", [1], "Fail", "Lặp lại lỗi dữ liệu cũ năm 2011. Không hoàn thành việc ước tính tỷ giá.")
# TC-18
text = mark_pass(text, r"TC-18", [0, 1], "Pass", "Gợi ý range giá khá chuẩn. Nhưng bị sai ngôn ngữ.")

# TC-19
text = mark_pass(text, r"TC-19", [0, 2], "Pass", "Từ chối lịch sự, nhưng không điều hướng người dùng về chủ đề chính hiệu quả.")
# TC-20
text = mark_pass(text, r"TC-20", [], "Fail", "Bot không hỏi thêm mà tự ý chốt ngay lập tức (cho đi Đà Nẵng).")
# TC-21
text = mark_pass(text, r"TC-21", [0, 1, 2], "Pass", "Có sự so sánh hợp lý.")
# TC-22
text = mark_pass(text, r"TC-22", [0, 1, 2], "Pass", "Hiểu context địa điểm nhỏ, đưa ra thời điểm lúa chín phù hợp.")
# TC-23
text = mark_pass(text, r"TC-23", [0, 1, 2], "Pass", "Có cố gắng biến tấu câu trả lời qua lịch sử nguồn gốc phở để tránh lặp máy móc.")
# TC-24
text = mark_pass(text, r"TC-24", [], "Fail", "Lịch trình vô lý và có ảo giác (Khám phá Hạ Long Bay bằng tàu hỏa).")

# TC-25
text = mark_pass(text, r"TC-25", [], "Fail", "Tiếp tục không hỏi vị trí user mà liệt kê chung chung.")
# TC-26
text = mark_pass(text, r"TC-26", [0, 2], "Fail", "Không đi vào giải quyết vấn đề mà liệt kê vòng vo lại 1 đống suggest chung chung.")
# TC-27
text = mark_pass(text, r"TC-27", [1, 2], "Fail", "Prompting lỗi, User khen mà Bot bảo: 'Great question!'")
# TC-28
text = mark_pass(text, r"TC-28", [0], "Fail", "Thất bại trong việc cá nhân hóa, 2 câu trả lời có chung 1 khuôn mẫu prompt.")
# TC-29
text = mark_pass(text, r"TC-29", [0, 1], "Fail", "Lịch trình đề xuất không hợp lý về thời gian di chuyển, và không tư vấn kỹ cho vụ hải sản (chỉ nói chung).")
# TC-30
text = mark_pass(text, r"TC-30", [0, 1, 2], "Pass", "Giữ được context hội thoại từ câu mở đầu tốt.")

# Add Notes to the end
summary = """

### KẾT QUẢ ĐÁNH GIÁ CHUNG NHỮNG LỖI CẦN FIX
Dựa trên kết quả test, đây là những vấn đề nghiêm trọng hệ thống đang gặp phải cần fix gấp:
1. **Lỗi nghiêm trọng về ngôn ngữ (Language Mixing / Override)**: Mặc dù có rule ngôn ngữ nhưng System Prompt ép cứng prefix "Ôi bạn hỏi đúng chỗ rồi!/Great question!" và đuôi câu. Hậu quả là Bot gần như LUÔN LUÔN trả lời lại bằng tiếng Việt hoặc bị lai căng ngoại ngữ bất chấp người dùng hỏi tiếng nước ngoài.
2. **Ảo giác kiến thức & Sai lệch số liệu (Knowledge Hallucination)**: Data RAG chứa thông tin rất rác và cũ ví dụ như tỷ giá (kẹt năm 2011). Có những ảo giác ngớ ngẩn (công dân Mỹ không cần visa, Vịnh Hạ Long đi bằng "tàu hỏa", thạch agar).
3. **Thiết kế Prompt thiếu tính tương tác**: Bot không có tư duy "thu thập yêu cầu" (Gathering Requirements). Khi hỏi mơ hồ, bot tự biên tự diễn (Tự cho người dùng đến Đà Nẵng) thay vì khai thác thông tin trước. Các mẫu câu cố định (Great question!) xuất hiện không đúng ngữ cảnh (trong lời cảm ơn).

### ĐỀ XUẤT CẢI TIẾN (IMPROVEMENTS)
- **Thiết kế lại System Prompt**: Cắt bỏ các câu chào cứng nhắc tiếng Việt/Anh để LLM tự do theo ngôn ngữ của user. Đưa quy tắc ngôn ngữ lên làm Master Rule độc lập với Tone Voice.
- **Dọn dẹp DB RAG (Data Preprocessing)**: Lọc loại bỏ những số liệu tỷ giá hoặc tin tức rác của các năm thập kỷ trước. 
- **Thiết lập Rule cho Follow-up Question**: Cần có rule yêu cầu LLM *phải* đặt ngược lại max 1 câu hỏi nếu Request quá ngắn hoặc mơ hồ (Như ở TC-20, 25).
"""

# replace TỔNG KẾT KẾT QUẢ TEST table
table_old = """| Nhóm | Tổng | Pass | Fail | Tỷ lệ |
|------|------|------|------|--------|
| Ngôn ngữ (TC-01 → TC-06) | 6 | | | |
| Kiến thức (TC-07 → TC-14) | 8 | | | |
| Thời gian thực (TC-15 → TC-18) | 4 | | | |
| Edge case (TC-19 → TC-24) | 6 | | | |
| Trải nghiệm UX (TC-25 → TC-30) | 6 | | | |
| **TỔNG** | **30** | | | |"""

table_new = """| Nhóm | Tổng | Pass | Fail | Tỷ lệ |
|------|------|------|------|--------|
| Ngôn ngữ (TC-01 → TC-06) | 6 | 3 | 3 | 50% |
| Kiến thức (TC-07 → TC-14) | 8 | 0 | 8 | 0% |
| Thời gian thực (TC-15 → TC-18) | 4 | 3 | 1 | 75% |
| Edge case (TC-19 → TC-24) | 6 | 4 | 2 | 66.7% |
| Trải nghiệm UX (TC-25 → TC-30) | 6 | 1 | 5 | 16.7% |
| **TỔNG** | **30** | **11** | **19** | **36.7%** |"""

text = text.replace(table_old, table_new)

# append to file
if "KẾT QUẢ ĐÁNH GIÁ CHUNG" not in text:
    text += summary

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)
