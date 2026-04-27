package com.vietmoney.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.url}")
    private String geminiUrl;

    // ─────────────────────────────────────────────────────────────────────
    // Repair JSON bị truncate: cắt tại "}" cuối cùng hoàn chỉnh,
    // rồi đóng đúng số bracket/brace còn mở
    // ─────────────────────────────────────────────────────────────────────
    private String repairTruncatedJson(String json) {
        // Tìm "}" cuối cùng trong chuỗi (item hoàn chỉnh cuối cùng)
        int lastSafeEnd = -1;
        for (int i = json.length() - 1; i >= 0; i--) {
            if (json.charAt(i) == '}') {
                lastSafeEnd = i + 1;
                break;
            }
        }
        if (lastSafeEnd <= 0) return json;

        String truncated = json.substring(0, lastSafeEnd);

        // Đếm depth sau khi cắt
        int openBraces   = 0;
        int openBrackets = 0;
        boolean inString = false;
        boolean escape   = false;

        for (char c : truncated.toCharArray()) {
            if (escape)    { escape = false; continue; }
            if (c == '\\') { escape = true;  continue; }
            if (c == '"')  { inString = !inString; continue; }
            if (inString)  continue;

            if      (c == '{') openBraces++;
            else if (c == '}') openBraces--;
            else if (c == '[') openBrackets++;
            else if (c == ']') openBrackets--;
        }

        // Đóng theo thứ tự đúng: ] trước } sau
        StringBuilder sb = new StringBuilder(truncated);
        for (int i = 0; i < openBrackets; i++) sb.append("]");
        for (int i = 0; i < openBraces;   i++) sb.append("}");

        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Chuẩn hoá output Gemini → format chuẩn mà frontend dùng
    // Xử lý cả 2 format Gemini có thể trả:
    //   A) "itinerary": {"1": [...]}
    //   B) "days": [{"dayNumber":1, "items":[...]}]
    // ─────────────────────────────────────────────────────────────────────
    private Map<String, Object> normalizeResult(JsonNode resultNode) {
        String summary   = resultNode.path("summary").asText("");
        String totalCost = resultNode.path("totalEstimatedCost").asText("");

        Map<String, Object> itineraryMap = new LinkedHashMap<>();

        // Format A: "itinerary" object
        JsonNode itNode = resultNode.path("itinerary");
        if (!itNode.isMissingNode() && itNode.isObject()) {
            itineraryMap = objectMapper.convertValue(
                    itNode,
                    objectMapper.getTypeFactory().constructMapType(
                            Map.class, String.class, Object.class)
            );
        }

        // Format B: "days" array — convert + chuẩn hoá field names
        JsonNode daysNode = resultNode.path("days");
        if (!daysNode.isMissingNode() && daysNode.isArray() && itineraryMap.isEmpty()) {
            for (JsonNode dayNode : daysNode) {
                int dayNumber = dayNode.path("dayNumber").asInt(0);
                if (dayNumber <= 0) continue;

                JsonNode itemsNode = dayNode.path("items");
                if (!itemsNode.isArray()) continue;

                List<Map<String, String>> normalizedItems = new ArrayList<>();
                for (JsonNode item : itemsNode) {
                    Map<String, String> entry = new LinkedHashMap<>();
                    // timeSlot → time
                    entry.put("time",
                            item.has("time")     ? item.path("time").asText()
                                    : item.path("timeSlot").asText(""));
                    entry.put("location", item.path("location").asText(""));
                    // description → activity
                    entry.put("activity",
                            item.has("activity")    ? item.path("activity").asText()
                                    : item.path("description").asText(""));
                    // estimatedCost → cost
                    entry.put("cost",
                            item.has("cost")         ? item.path("cost").asText()
                                    : item.path("estimatedCost").asText(""));
                    normalizedItems.add(entry);
                }
                itineraryMap.put(String.valueOf(dayNumber), normalizedItems);
            }
        }

        return Map.of(
                "summary",            summary,
                "totalEstimatedCost", totalCost,
                "itinerary",          itineraryMap
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Main
    // ─────────────────────────────────────────────────────────────────────
    public Map<String, Object> generateTravelItinerary(
            String destination,
            String budget,
            int numberOfPeople,
            String startDate,
            String endDate,
            String currency
    ) {
        boolean hasValidKey = apiKey != null
                && !apiKey.isBlank()
                && !apiKey.equals("YOUR_GEMINI_API_KEY");

        if (!hasValidKey) {
            log.warn("Gemini API key chưa cấu hình, dùng fallback.");
            return buildFallbackItinerary(destination, budget, numberOfPeople,
                    startDate, endDate, currency);
        }

        // Tính số ngày
        int days = 3;
        String daysInfo;
        if (startDate != null && endDate != null) {
            try {
                long diff = ChronoUnit.DAYS.between(
                        LocalDate.parse(startDate), LocalDate.parse(endDate));
                days     = (int) Math.max(diff + 1, 1);
                daysInfo = "từ " + startDate + " đến " + endDate + " (" + days + " ngày)";
            } catch (Exception e) {
                daysInfo = "3 ngày";
            }
        } else {
            daysInfo = "3 ngày";
        }

        int activitiesPerDay = days > 5 ? 3 : 4;

        String prompt = String.format("""
            Bạn là chuyên gia du lịch Việt Nam. Lên lịch trình cho:
            - Điểm đến: %s
            - Số người: %d
            - Ngân sách tổng: %s %s
            - Thời gian: %s

            QUY TẮC:
            1. Chỉ địa điểm thực tế tại %s
            2. Mỗi ngày ĐÚNG %d hoạt động
            3. Mô tả tối đa 10 từ/hoạt động
            4. Tổng chi phí <= %s %s

            Trả về JSON hợp lệ, KHÔNG markdown, KHÔNG text thừa:
            {
              "summary": "Tóm tắt 1 câu ngắn gọn",
              "totalEstimatedCost": "X,XXX,000đ",
              "itinerary": {
                "1": [
                  {"time":"08:00","location":"Tên địa điểm","activity":"Mô tả ngắn","cost":"XXX,000đ"}
                ],
                "2": [...]
              }
            }
            """,
                destination, numberOfPeople, budget, currency, daysInfo,
                destination, activitiesPerDay, budget, currency
        );

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{Map.of("text", prompt)})
                },
                "generationConfig", Map.of(
                        "temperature",     0.4,
                        "maxOutputTokens", 8192
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

        try {
            log.info("Calling Gemini: destination={}, days={}", destination, days);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    geminiUrl + "?key=" + apiKey, request, String.class);

            JsonNode root       = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");

            if (candidates.isEmpty()) {
                log.warn("Gemini: không có candidates.");
                return buildFallbackItinerary(destination, budget, numberOfPeople,
                        startDate, endDate, currency);
            }

            String finishReason = candidates.get(0).path("finishReason").asText("");
            String textContent  = candidates.get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            // Clean markdown
            textContent = textContent
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();

            log.info("Gemini finishReason={}, length={}", finishReason, textContent.length());

            // Repair nếu bị cắt
            if ("MAX_TOKENS".equals(finishReason) || !textContent.endsWith("}")) {
                log.warn("JSON truncated, repairing...");
                textContent = repairTruncatedJson(textContent);
            }

            // Parse + normalise
            JsonNode resultNode = objectMapper.readTree(textContent);
            Map<String, Object> result = normalizeResult(resultNode);

            @SuppressWarnings("unchecked")
            Map<String, Object> itinerary = (Map<String, Object>) result.get("itinerary");
            if (itinerary == null || itinerary.isEmpty()) {
                log.warn("Itinerary rỗng sau normalise, dùng fallback.");
                return buildFallbackItinerary(destination, budget, numberOfPeople,
                        startDate, endDate, currency);
            }

            log.info("Gemini OK: {} days generated.", itinerary.size());
            return result;

        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Gemini 429, dùng fallback.");
            return buildFallbackItinerary(destination, budget, numberOfPeople,
                    startDate, endDate, currency);

        } catch (HttpClientErrorException e) {
            log.error("Gemini HTTP {}: {}", e.getStatusCode(), e.getMessage());
            return buildFallbackItinerary(destination, budget, numberOfPeople,
                    startDate, endDate, currency);

        } catch (Exception e) {
            log.error("Lỗi Gemini: {}", e.getMessage());
            return buildFallbackItinerary(destination, budget, numberOfPeople,
                    startDate, endDate, currency);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Fallback khi Gemini không khả dụng
    // ─────────────────────────────────────────────────────────────────────
    private Map<String, Object> buildFallbackItinerary(
            String destination, String budget, int numberOfPeople,
            String startDate, String endDate, String currency
    ) {
        int days = 3;
        if (startDate != null && endDate != null) {
            try {
                long diff = ChronoUnit.DAYS.between(
                        LocalDate.parse(startDate), LocalDate.parse(endDate));
                days = (int) Math.max(diff + 1, 1);
            } catch (Exception ignored) {}
        }

        List<List<Map<String, String>>> templates = List.of(
                List.of(
                        Map.of("time","07:30","location","Khách sạn",
                                "activity","Ăn sáng, nhận phòng","cost","50,000đ/người"),
                        Map.of("time","09:00","location", destination + " – Khu trung tâm",
                                "activity","Tham quan điểm nổi bật","cost","100,000đ/người"),
                        Map.of("time","12:00","location","Nhà hàng địa phương",
                                "activity","Ăn trưa đặc sản","cost","120,000đ/người"),
                        Map.of("time","19:00","location","Phố ẩm thực",
                                "activity","Ăn tối, dạo phố đêm","cost","100,000đ/người")
                ),
                List.of(
                        Map.of("time","08:00","location","Khách sạn",
                                "activity","Ăn sáng","cost","50,000đ/người"),
                        Map.of("time","09:30","location", destination + " – Bảo tàng",
                                "activity","Tham quan bảo tàng lịch sử","cost","80,000đ/người"),
                        Map.of("time","12:30","location","Quán ăn địa phương",
                                "activity","Ăn trưa","cost","100,000đ/người"),
                        Map.of("time","18:30","location","Nhà hàng",
                                "activity","Ăn tối, nghỉ ngơi","cost","200,000đ/người")
                ),
                List.of(
                        Map.of("time","08:30","location","Khách sạn",
                                "activity","Ăn sáng, trả phòng","cost","50,000đ/người"),
                        Map.of("time","10:00","location", destination + " – Chợ",
                                "activity","Mua đồ lưu niệm","cost","200,000đ"),
                        Map.of("time","12:00","location","Nhà hàng",
                                "activity","Ăn trưa chia tay","cost","150,000đ/người"),
                        Map.of("time","15:00","location","Sân bay / Bến xe",
                                "activity","Khởi hành về nhà","cost","0đ")
                )
        );

        Map<String, Object> itinerary = new LinkedHashMap<>();
        for (int d = 1; d <= days; d++) {
            itinerary.put(String.valueOf(d), templates.get((d - 1) % templates.size()));
        }

        return Map.of(
                "summary", String.format(
                        "Lịch trình mẫu %d ngày tại %s cho %d người. " +
                                "AI tạm thời không khả dụng — vui lòng chỉnh sửa theo sở thích.",
                        days, destination, numberOfPeople),
                "totalEstimatedCost", budget + " " + currency + " (dự kiến)",
                "itinerary", itinerary
        );
    }
}